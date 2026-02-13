"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const db_1 = require("../../config/db");
const price_service_1 = require("../price/price.service");
const audit_service_1 = require("../audit/audit.service");
const http_error_1 = require("../../common/errors/http-error");
class PortfolioService {
    priceService;
    auditService;
    constructor() {
        this.priceService = new price_service_1.PriceService();
        this.auditService = new audit_service_1.AuditService();
    }
    async createPortfolio(userId, name, baseCurrency = 'USD') {
        const portfolio = await db_1.prisma.portfolio.create({
            data: {
                userId,
                name,
                baseCurrency,
                isDefault: false, // Logic to handle default?
            },
        });
        // Log portfolio creation
        await this.auditService.logCreate(userId, 'PORTFOLIO', portfolio.id, { name, baseCurrency, isDefault: false });
        return portfolio;
    }
    async updatePortfolio(userId, portfolioId, data) {
        // First verify portfolio exists and user owns it
        const portfolio = await db_1.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });
        if (!portfolio) {
            throw new http_error_1.NotFoundError('Portfolio not found');
        }
        const oldValue = { ...portfolio };
        const updatedPortfolio = await db_1.prisma.portfolio.update({
            where: { id: portfolioId },
            data,
        });
        // Log portfolio update
        await this.auditService.logUpdate(userId, 'PORTFOLIO', portfolioId, oldValue, data);
        return updatedPortfolio;
    }
    async deletePortfolio(userId, portfolioId) {
        // First verify portfolio exists and user owns it
        const portfolio = await db_1.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                positions: true,
                transactions: true,
            },
        });
        if (!portfolio) {
            throw new http_error_1.NotFoundError('Portfolio not found');
        }
        // Check if portfolio has positions or transactions
        if (portfolio.positions.length > 0 || portfolio.transactions.length > 0) {
            throw new Error('Cannot delete portfolio with positions or transactions. Remove them first.');
        }
        const oldValue = { ...portfolio };
        await db_1.prisma.portfolio.delete({
            where: { id: portfolioId },
        });
        // Log portfolio deletion
        await this.auditService.logDelete(userId, 'PORTFOLIO', portfolioId, oldValue);
    }
    async getUserPortfolios(userId) {
        return db_1.prisma.portfolio.findMany({
            where: { userId },
            include: {
                snapshots: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }
    async getPortfolioById(id, userId) {
        return db_1.prisma.portfolio.findFirst({
            where: { id, userId },
            include: {
                positions: {
                    include: { asset: true },
                },
            },
        });
    }
    /**
     * Get comprehensive portfolio summary with analytics
     */
    async getPortfolioSummary(portfolioId, userId) {
        const portfolio = await db_1.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                positions: {
                    include: {
                        asset: true,
                    },
                },
                snapshots: {
                    orderBy: { createdAt: 'desc' },
                    take: 30, // Last 30 days for performance chart
                },
            },
        });
        if (!portfolio) {
            throw new Error('Portfolio not found');
        }
        // Calculate current values for all positions
        const positionSummaries = [];
        let totalValue = 0;
        let totalCostBasis = 0;
        let totalUnrealizedPnl = 0;
        let totalRealizedPnl = 0;
        for (const position of portfolio.positions) {
            try {
                const currentPrice = await this.priceService.getPriceInBase(position.assetId, portfolio.baseCurrency);
                const marketValue = position.quantity.mul(currentPrice);
                const costBasis = position.costBasis;
                const unrealizedPnl = marketValue.minus(costBasis);
                const pnlPercent = costBasis.isZero() ? 0 : unrealizedPnl.div(costBasis).mul(100);
                const positionSummary = {
                    assetId: position.assetId,
                    symbol: position.asset.symbol,
                    name: position.asset.name,
                    assetType: position.asset.assetType,
                    quantity: position.quantity.toNumber(),
                    avgPrice: position.avgPrice.toNumber(),
                    currentPrice: currentPrice.toNumber(),
                    marketValue: marketValue.toNumber(),
                    costBasis: costBasis.toNumber(),
                    unrealizedPnl: unrealizedPnl.toNumber(),
                    realizedPnl: Number(position.realizedPnl),
                    pnlPercent: typeof pnlPercent === 'number' ? pnlPercent : pnlPercent.toNumber(),
                    weight: 0, // Will calculate after total value
                };
                positionSummaries.push(positionSummary);
                totalValue += marketValue.toNumber();
                totalCostBasis += costBasis.toNumber();
                totalUnrealizedPnl += unrealizedPnl.toNumber();
                totalRealizedPnl += Number(position.realizedPnl);
            }
            catch (error) {
                console.error(`Failed to calculate position for asset ${position.assetId}:`, error);
            }
        }
        // Calculate weights
        positionSummaries.forEach(pos => {
            pos.weight = totalValue > 0 ? (pos.marketValue / totalValue) * 100 : 0;
        });
        // Calculate allocation by asset type
        const allocation = this.calculateAllocation(positionSummaries);
        // Calculate daily change from snapshots
        const dailyChange = this.calculateDailyChange(portfolio.snapshots, totalValue);
        // Prepare performance points
        const performance = this.preparePerformancePoints(portfolio.snapshots);
        return {
            id: portfolio.id,
            name: portfolio.name,
            baseCurrency: portfolio.baseCurrency,
            totalValue,
            totalUnrealizedPnl,
            totalRealizedPnl,
            dailyChange: dailyChange.change,
            dailyChangePercent: dailyChange.percent,
            positions: positionSummaries,
            allocation,
            performance,
        };
    }
    /**
     * Calculate allocation by asset type
     */
    calculateAllocation(positions) {
        const allocationMap = new Map();
        for (const position of positions) {
            const assetType = position.assetType;
            const current = allocationMap.get(assetType) || { value: 0, count: 0 };
            current.value += position.marketValue;
            current.count += 1;
            allocationMap.set(assetType, current);
        }
        const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        return Array.from(allocationMap.entries()).map(([assetType, data]) => ({
            assetType,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        }));
    }
    /**
     * Calculate daily change from snapshots
     */
    calculateDailyChange(snapshots, currentValue) {
        if (snapshots.length < 2) {
            return { change: 0, percent: 0 };
        }
        // Get yesterday's snapshot (most recent before today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterdaySnapshot = snapshots
            .filter(s => new Date(s.createdAt) < today)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (!yesterdaySnapshot) {
            return { change: 0, percent: 0 };
        }
        const yesterdayValue = Number(yesterdaySnapshot.totalValue);
        const change = currentValue - yesterdayValue;
        const percent = yesterdayValue === 0 ? 0 : (change / yesterdayValue) * 100;
        return { change, percent };
    }
    /**
     * Prepare performance points for chart
     */
    preparePerformancePoints(snapshots) {
        return snapshots.map(snapshot => ({
            date: snapshot.createdAt,
            value: Number(snapshot.totalValue),
            pnl: Number(snapshot.totalUnrealizedPnl) + Number(snapshot.totalRealizedPnl),
        })).sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    /**
     * Get portfolio performance over time range
     */
    async getPortfolioPerformance(portfolioId, userId, days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const snapshots = await db_1.prisma.portfolioSnapshot.findMany({
            where: {
                portfolioId,
                portfolio: { userId },
                createdAt: { gte: cutoffDate },
            },
            orderBy: { createdAt: 'asc' },
        });
        return snapshots.map(snapshot => ({
            date: snapshot.createdAt,
            value: Number(snapshot.totalValue),
            pnl: Number(snapshot.totalUnrealizedPnl) + Number(snapshot.totalRealizedPnl),
        }));
    }
    /**
     * Get top gainers/losers
     */
    async getTopPerformers(portfolioId, userId, limit = 5) {
        const portfolio = await db_1.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                positions: {
                    include: { asset: true },
                },
            },
        });
        if (!portfolio) {
            throw new Error('Portfolio not found');
        }
        const positionSummaries = [];
        for (const position of portfolio.positions) {
            try {
                const currentPrice = await this.priceService.getPriceInBase(position.assetId, portfolio.baseCurrency);
                const marketValue = position.quantity.mul(currentPrice);
                const costBasis = position.costBasis;
                const unrealizedPnl = marketValue.minus(costBasis);
                const pnlPercent = costBasis.isZero() ? 0 : unrealizedPnl.div(costBasis).mul(100);
                const positionSummary = {
                    assetId: position.assetId,
                    symbol: position.asset.symbol,
                    name: position.asset.name,
                    assetType: position.asset.assetType,
                    quantity: position.quantity.toNumber(),
                    avgPrice: position.avgPrice.toNumber(),
                    currentPrice: currentPrice.toNumber(),
                    marketValue: marketValue.toNumber(),
                    costBasis: costBasis.toNumber(),
                    unrealizedPnl: unrealizedPnl.toNumber(),
                    realizedPnl: Number(position.realizedPnl),
                    pnlPercent: typeof pnlPercent === 'number' ? pnlPercent : pnlPercent.toNumber(),
                    weight: 0,
                };
                positionSummaries.push(positionSummary);
            }
            catch (error) {
                console.error(`Failed to calculate position for asset ${position.assetId}:`, error);
            }
        }
        // Sort by P&L percent and return top/bottom
        return positionSummaries
            .sort((a, b) => b.pnlPercent - a.pnlPercent)
            .slice(0, limit);
    }
    /**
     * Update portfolio snapshot (used by scheduled job)
     */
    async updatePortfolioSnapshot(portfolioId) {
        const portfolio = await db_1.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                positions: {
                    include: { asset: true },
                },
            },
        });
        if (!portfolio) {
            return;
        }
        let totalValue = 0;
        let totalUnrealizedPnl = 0;
        let totalRealizedPnl = 0;
        for (const position of portfolio.positions) {
            try {
                const currentPrice = await this.priceService.getPriceInBase(position.assetId, portfolio.baseCurrency);
                const marketValue = position.quantity.mul(currentPrice);
                const unrealizedPnl = marketValue.minus(position.costBasis);
                totalValue += marketValue.toNumber();
                totalUnrealizedPnl += unrealizedPnl.toNumber();
                totalRealizedPnl += Number(position.realizedPnl);
            }
            catch (error) {
                console.error(`Failed to calculate position for asset ${position.assetId}:`, error);
            }
        }
        await db_1.prisma.portfolioSnapshot.create({
            data: {
                portfolioId,
                totalValue,
                totalUnrealizedPnl,
                totalRealizedPnl,
            },
        });
    }
}
exports.PortfolioService = PortfolioService;
