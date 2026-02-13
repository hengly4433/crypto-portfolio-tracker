import { z } from 'zod';

// DTO for creating/updating user settings
export const createUserSettingsSchema = z.object({
  body: z.object({
    baseCurrency: z.string().default('USD'),
    timezone: z.string().default('UTC'),
    locale: z.string().default('en-US'),
    darkMode: z.boolean().default(false),
  }),
});

export const updateUserSettingsSchema = z.object({
  body: z.object({
    baseCurrency: z.string().optional(),
    timezone: z.string().optional(),
    locale: z.string().optional(),
    darkMode: z.boolean().optional(),
  }),
});

// TypeScript types
export type CreateUserSettingsDto = z.infer<typeof createUserSettingsSchema>['body'];
export type UpdateUserSettingsDto = z.infer<typeof updateUserSettingsSchema>['body'];

// Response type
export interface UserSettingsResponse {
  id: string;
  userId: string;
  baseCurrency: string;
  timezone: string;
  locale: string;
  darkMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}