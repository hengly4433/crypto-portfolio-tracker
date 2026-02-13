import bcrypt from 'bcrypt';
import { prisma } from '../../config/db';
import { generateTokens, verifyRefreshToken, getRefreshTokenExpiryDate } from '../../common/utils/jwt';
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
    
    // Generate tokens
    const userId = result.user.id.toString(); 
    const tokens = generateTokens({ userId, email: result.user.email });

    // Store session
    await this.createSession(result.user.id, tokens.jti);

    return { user: result.user, tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } };
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

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log user login
    await this.auditService.logLogin(user.id);

    // Generate tokens
    const userId = user.id.toString();
    const tokens = generateTokens({ userId, email: user.email });

    // Store session
    await this.createSession(user.id, tokens.jti);

    return { user, tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } };
  }

  async refresh(refreshToken: string) {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check session exists and not revoked
    if (payload.jti) {
      const session = await prisma.userSession.findFirst({
        where: { jwtId: payload.jti },
      });

      if (!session) {
        throw new UnauthorizedError('Session not found');
      }

      if (session.revokedAt) {
        throw new UnauthorizedError('Session has been revoked');
      }

      // Revoke old session
      await prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }

    // Generate new tokens
    const newTokens = generateTokens({ userId: payload.userId, email: payload.email });

    // Create new session
    await this.createSession(BigInt(payload.userId), newTokens.jti);

    return { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken };
  }

  async logout(jti?: string, userId?: string) {
    if (jti) {
      // Revoke specific session by JWT ID
      await prisma.userSession.updateMany({
        where: { jwtId: jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      // Revoke all sessions for user
      await prisma.userSession.updateMany({
        where: { userId: BigInt(userId), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  private async createSession(userId: bigint, jwtId: string, userAgent?: string, ipAddress?: string) {
    return prisma.userSession.create({
      data: {
        userId,
        jwtId,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });
  }
}
