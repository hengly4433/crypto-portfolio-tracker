import bcrypt from 'bcrypt';
import { prisma } from '../../config/db';
import { generateTokens } from '../../common/utils/jwt';
import { BadRequestError, UnauthorizedError } from '../../common/errors/http-error';
import { AuditService, AuditAction } from '../audit/audit.service';

export class AuthService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async register(email: string, password: string, fullName?: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Use transaction to create user, settings, and default portfolio atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
        },
      });

      // 2. Create user settings with defaults
      const userSettings = await tx.userSettings.create({
        data: {
          userId: user.id,
          baseCurrency: 'USD',
          timezone: 'UTC',
          locale: 'en-US',
          darkMode: false,
        },
      });

      // 3. Create default portfolio
      const defaultPortfolio = await tx.portfolio.create({
        data: {
          userId: user.id,
          name: 'My Portfolio',
          baseCurrency: 'USD',
          isDefault: true,
          description: 'Default portfolio',
        },
      });

      // 4. Find or create manual exchange
      let manualExchange = await tx.exchange.findFirst({
        where: { code: 'MANUAL' },
      });

      if (!manualExchange) {
        // Create manual exchange if it doesn't exist (should be seeded)
        manualExchange = await tx.exchange.create({
          data: {
            name: 'Manual',
            code: 'MANUAL',
            type: 'WALLET',
            websiteUrl: null,
          },
        });
      }

      // 5. Create default manual account
      const defaultAccount = await tx.userAccount.create({
        data: {
          userId: user.id,
          exchangeId: manualExchange.id,
          name: 'Manual Account',
          accountType: 'WALLET',
          baseCurrency: 'USD',
          isDefault: true,
        },
      });

      return { user, userSettings, defaultPortfolio, defaultAccount };
    });
    
    // Log user creation
    await this.auditService.logCreate(
      result.user.id,
      'USER',
      result.user.id,
      { email: result.user.email, fullName: result.user.fullName }
    );
    
    // Convert BigInt to string for JWT payload
    const userId = result.user.id.toString(); 
    const tokens = generateTokens({ userId, email: result.user.email });

    return { user: result.user, tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Log user login
    await this.auditService.logLogin(user.id);

    const userId = user.id.toString();
    const tokens = generateTokens({ userId, email: user.email });

    return { user, tokens };
  }
}
