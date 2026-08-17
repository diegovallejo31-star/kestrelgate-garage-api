import { z } from 'zod';
import { dayString } from '../../lib/schemas';
import { REMINDER_STATUSES } from './reminder.types';

export const createReminderSchema = z
  .object({
    kind: z.enum(['mot_due', 'service_due', 'recall']),
    dueOn: dayString,
    note: z.string().min(1).max(120),
  })
  .strict();

export const reminderIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const vehicleIdParamSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
});

export const reminderQuerySchema = z
  .object({
    status: z.enum(REMINDER_STATUSES as [string, ...string[]]).optional(),
    kind: z.enum(['mot_due', 'service_due', 'recall']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const reminderStatusSchema = z
  .object({ status: z.enum(['sent', 'dismissed']) })
  .strict();
