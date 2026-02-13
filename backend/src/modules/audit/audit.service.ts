import { prisma } from '../../config/db';
import { Prisma } from '@prisma/client';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  API_CALL = 'API_CALL',
}

export interface AuditLogData {
  userId?: bigint;
  entityType: string;
  entityId: bigint;
  action: AuditAction;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
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
    } catch (error) {
      // Don't throw errors from audit logging to avoid breaking main functionality
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: bigint, ipAddress?: string): Promise<void> {
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
  async logLogout(userId: bigint, ipAddress?: string): Promise<void> {
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
  async logCreate(
    userId: bigint,
    entityType: string,
    entityId: bigint,
    newValue: any,
    ipAddress?: string
  ): Promise<void> {
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
  async logUpdate(
    userId: bigint,
    entityType: string,
    entityId: bigint,
    oldValue: any,
    newValue: any,
    ipAddress?: string
  ): Promise<void> {
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
  async logDelete(
    userId: bigint,
    entityType: string,
    entityId: bigint,
    oldValue: any,
    ipAddress?: string
  ): Promise<void> {
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
  async getEntityAuditLogs(
    entityType: string,
    entityId: bigint,
    limit: number = 50
  ): Promise<any[]> {
    return prisma.auditLog.findMany({
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
  async getUserAuditLogs(userId: bigint, limit: number = 100): Promise<any[]> {
    return prisma.auditLog.findMany({
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
  async searchAuditLogs(filters: {
    userId?: bigint;
    entityType?: string;
    entityId?: bigint;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
  }, limit: number = 100): Promise<any[]> {
    const where: any = {};

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

    return prisma.auditLog.findMany({
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
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}