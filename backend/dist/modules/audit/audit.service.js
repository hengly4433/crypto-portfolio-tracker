"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = exports.AuditAction = void 0;
const db_1 = require("../../config/db");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["API_CALL"] = "API_CALL";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
class AuditService {
    /**
     * Create an audit log entry
     */
    async log(data) {
        try {
            await db_1.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    action: data.action,
                    oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : null,
                    newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : null,
                    ipAddress: data.ipAddress,
                },
            });
        }
        catch (error) {
            // Don't throw errors from audit logging to avoid breaking main functionality
            console.error('Failed to create audit log:', error);
        }
    }
    /**
     * Log user login
     */
    async logLogin(userId, ipAddress) {
        await this.log({
            userId,
            entityType: 'USER',
            entityId: userId,
            action: AuditAction.LOGIN,
            ipAddress,
            metadata: { timestamp: new Date().toISOString() },
        });
    }
    /**
     * Log user logout
     */
    async logLogout(userId, ipAddress) {
        await this.log({
            userId,
            entityType: 'USER',
            entityId: userId,
            action: AuditAction.LOGOUT,
            ipAddress,
            metadata: { timestamp: new Date().toISOString() },
        });
    }
    /**
     * Log entity creation
     */
    async logCreate(userId, entityType, entityId, newValue, ipAddress) {
        await this.log({
            userId,
            entityType,
            entityId,
            action: AuditAction.CREATE,
            newValue,
            ipAddress,
        });
    }
    /**
     * Log entity update
     */
    async logUpdate(userId, entityType, entityId, oldValue, newValue, ipAddress) {
        await this.log({
            userId,
            entityType,
            entityId,
            action: AuditAction.UPDATE,
            oldValue,
            newValue,
            ipAddress,
        });
    }
    /**
     * Log entity deletion
     */
    async logDelete(userId, entityType, entityId, oldValue, ipAddress) {
        await this.log({
            userId,
            entityType,
            entityId,
            action: AuditAction.DELETE,
            oldValue,
            ipAddress,
        });
    }
    /**
     * Get audit logs for a specific entity
     */
    async getEntityAuditLogs(entityType, entityId, limit = 50) {
        return db_1.prisma.auditLog.findMany({
            where: {
                entityType,
                entityId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
    /**
     * Get audit logs for a user
     */
    async getUserAuditLogs(userId, limit = 100) {
        return db_1.prisma.auditLog.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
    /**
     * Search audit logs with filters
     */
    async searchAuditLogs(filters, limit = 100) {
        const where = {};
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.entityType) {
            where.entityType = filters.entityType;
        }
        if (filters.entityId) {
            where.entityId = filters.entityId;
        }
        if (filters.action) {
            where.action = filters.action;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        if (filters.ipAddress) {
            where.ipAddress = { contains: filters.ipAddress };
        }
        return db_1.prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
    /**
     * Clean up old audit logs (retention policy)
     */
    async cleanupOldLogs(retentionDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await db_1.prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        return result.count;
    }
}
exports.AuditService = AuditService;
