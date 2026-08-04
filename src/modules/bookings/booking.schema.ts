import { z } from 'zod';
import { dayString } from '../../lib/schemas';
import { BOOKING_STATUSES } from './booking.types';

export const createBookingSchema = z
  .object({
    siteId: z.number().int().positive(),
    bookedFor: dayString,
    reason: z.string().min(1).max(120),
    odometerIn: z.number().int().min(0).max(1000000).optional(),
  })
  .strict();

export const updateBookingSchema = z
  .object({
    odometerIn: z.number().int().min(0).max(1000000).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const bookingIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const vehicleIdParamSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
});

export const bookingQuerySchema = z
  .object({
    status: z.enum(BOOKING_STATUSES as [string, ...string[]]).optional(),
    siteId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const bookingStatusSchema = z
  .object({
    status: z.enum(['booked', 'in_progress', 'awaiting_parts', 'completed', 'cancelled']),
  })
  .strict();
