"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../../config/db");
const jwt_1 = require("../../common/utils/jwt");
const http_error_1 = require("../../common/errors/http-error");
const audit_service_1 = require("../audit/audit.service");
class AuthService {
    auditService;
    constructor() {
        this.auditService = new audit_service_1.AuditService();
    }
    async register(email, password, fullName) {
        // Check if user already exists
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new http_error_1.BadRequestError('User already exists');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Use transaction to create user, settings, and default portfolio atomically
        const result = await db_1.prisma.$transaction(async (tx) => {
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
        await this.auditService.logCreate(result.user.id, 'USER', result.user.id, { email: result.user.email, fullName: result.user.fullName });
        // Convert BigInt to string for JWT payload
        const userId = result.user.id.toString();
        const tokens = (0, jwt_1.generateTokens)({ userId, email: result.user.email });
        return { user: result.user, tokens };
    }
    async login(email, password) {
        const user = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new http_error_1.UnauthorizedError('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new http_error_1.UnauthorizedError('Invalid credentials');
        }
        // Log user login
        await this.auditService.logLogin(user.id);
        const userId = user.id.toString();
        const tokens = (0, jwt_1.generateTokens)({ userId, email: user.email });
        return { user, tokens };
    }
}
exports.AuthService = AuthService;
