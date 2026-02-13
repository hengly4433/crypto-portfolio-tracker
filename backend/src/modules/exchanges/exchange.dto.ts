import { z } from 'zod';
import { ExchangeType } from '@prisma/client';

export interface CreateExchangeDto {
  name: string;
  code: string;
  type: ExchangeType;
  websiteUrl?: string;
}

export interface UpdateExchangeDto {
  name?: string;
  code?: string;
  type?: ExchangeType;
  websiteUrl?: string;
}

export interface ExchangeResponseDto {
  id: bigint;
  name: string;
  code: string;
  type: ExchangeType;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createExchangeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20).regex(/^[A-Z_]+$/),
    type: z.nativeEnum(ExchangeType),
    websiteUrl: z.string().url().optional().or(z.literal('')),
  }),
});

export const updateExchangeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(20).regex(/^[A-Z_]+$/).optional(),
    type: z.nativeEnum(ExchangeType).optional(),
    websiteUrl: z.string().url().optional().or(z.literal('')),
  }),
});