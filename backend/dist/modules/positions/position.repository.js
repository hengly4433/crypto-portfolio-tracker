"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionRepository = void 0;
const db_1 = require("../../config/db");
const client_1 = require("@prisma/client");
class PositionRepository {
    /**
     * Find position by portfolio, asset, and optionally user account
     */
    async findPosition(portfolioId, assetId, userAccountId) {
        return db_1.prisma.position.findFirst({
            where: {
                portfolioId,
                assetId,
                userAccountId: userAccountId || null,
            },
        });
    }
    /**
     * Find position by ID
     */
    async findById(id) {
        return db_1.prisma.position.findUnique({
            where: { id },
        });
    }
    /**
     * Find all positions for a portfolio
     */
    async findByPortfolio(portfolioId) {
        return db_1.prisma.position.findMany({
            where: { portfolioId },
            include: {
                asset: true,
                userAccount: true,
            },
        });
    }
    /**
     * Find positions for a portfolio and user account
     */
    async findByPortfolioAndAccount(portfolioId, userAccountId) {
        return db_1.prisma.position.findMany({
            where: {
                portfolioId,
                userAccountId,
            },
            include: {
                asset: true,
            },
        });
    }
    /**
     * Create a new position
     */
    async create(data) {
        return db_1.prisma.position.create({
            data: {
                ...data,
                realizedPnl: new client_1.Prisma.Decimal(0),
                unrealizedPnl: new client_1.Prisma.Decimal(0),
                lastUpdatedAt: new Date(),
            },
        });
    }
    /**
     * Update an existing position
     */
    async update(id, data) {
        return db_1.prisma.position.update({
            where: { id },
            data: {
                ...data,
                lastUpdatedAt: new Date(),
            },
        });
    }
    /**
     * Update position with atomic operations
     */
    async updateWithAtomic(portfolioId, assetId, userAccountId, updates) {
        // Use Prisma's update with where clause
        // This should be wrapped in a transaction at a higher level
        const position = await this.findPosition(portfolioId, assetId, userAccountId || undefined);
        if (!position) {
            throw new Error('Position not found');
        }
        const newQuantity = position.quantity.plus(updates.quantityDelta);
        const newCostBasis = position.costBasis.plus(updates.costBasisDelta);
        const newAvgPrice = newQuantity.isZero()
            ? new client_1.Prisma.Decimal(0)
            : newCostBasis.div(newQuantity);
        return db_1.prisma.position.update({
            where: { id: position.id },
            data: {
                quantity: newQuantity,
                costBasis: newCostBasis,
                avgPrice: newAvgPrice,
                lastUpdatedAt: new Date(),
            },
        });
    }
    /**
     * Delete a position
     */
    async delete(id) {
        await db_1.prisma.position.delete({
            where: { id },
        });
    }
    /**
     * Get portfolio positions with asset details
     */
    async getPortfolioPositionsWithDetails(portfolioId) {
        return db_1.prisma.position.findMany({
            where: { portfolioId },
            include: {
                asset: true,
                userAccount: true,
            },
            orderBy: {
                asset: {
                    symbol: 'asc',
                },
            },
        });
    }
    /**
     * Calculate portfolio totals
     */
    async calculatePortfolioTotals(portfolioId) {
        const positions = await this.findByPortfolio(portfolioId);
        const totals = positions.reduce((acc, position) => ({
            totalQuantity: acc.totalQuantity.plus(position.quantity),
            totalCostBasis: acc.totalCostBasis.plus(position.costBasis),
            totalRealizedPnl: acc.totalRealizedPnl.plus(position.realizedPnl),
            totalUnrealizedPnl: acc.totalUnrealizedPnl.plus(position.unrealizedPnl),
        }), {
            totalQuantity: new client_1.Prisma.Decimal(0),
            totalCostBasis: new client_1.Prisma.Decimal(0),
            totalRealizedPnl: new client_1.Prisma.Decimal(0),
            totalUnrealizedPnl: new client_1.Prisma.Decimal(0),
        });
        return totals;
    }
}
exports.PositionRepository = PositionRepository;
