import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email().max(160),
    fullName: z.string().min(2).max(120),
    password: z.string().min(12).max(200),
    role: z.enum(['technician', 'service_desk', 'parts', 'viewer']),
  })
  .strict();

export const signInSchema = z
  .object({ email: z.string().email().max(160), password: z.string().min(1).max(200) })
  .strict();
