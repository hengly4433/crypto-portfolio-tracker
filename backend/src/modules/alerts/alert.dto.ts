import { z } from 'zod';
import { AlertType } from '@prisma/client';

export interface CreateAlertDto {
  portfolioId?: bigint;
  assetId?: bigint;
  alertType: AlertType;
  conditionValue: number;
  lookbackWindowMinutes?: number;
}

export interface UpdateAlertDto {
  isActive?: boolean;
  conditionValue?: number;
  lookbackWindowMinutes?: number;
}

export interface AlertResponseDto {
  id: bigint;
  userId: bigint;
  portfolioId: bigint | null;
  assetId: bigint | null;
  alertType: AlertType;
  conditionValue: number;
  lookbackWindowMinutes: number | null;
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createAlertSchema = z.object({
  body: z.object({
    portfolioId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
    assetId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
    alertType: z.nativeEnum(AlertType),
    conditionValue: z.number().positive(),
    lookbackWindowMinutes: z.number().int().positive().optional(),
  }),
});

export const updateAlertSchema = z.object({
  body: z.object({
    isActive: z.boolean().optional(),
    conditionValue: z.number().positive().optional(),
    lookbackWindowMinutes: z.number().int().positive().optional(),
  }),
});