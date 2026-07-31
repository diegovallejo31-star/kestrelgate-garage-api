import { z } from 'zod';
import { dayString } from '../../lib/schemas';

export const createVehicleSchema = z
  .object({
    registration: z.string().min(1).max(120),
    make: z.string().min(1).max(120),
    model: z.string().min(1).max(120),
    fuel: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
    engineCc: z.number().int().min(0).max(10000),
    firstRegisteredOn: dayString,
    odometerMiles: z.number().int().min(0).max(1000000),
  })
  .strict();

export const updateVehicleSchema = z
  .object({
    odometerMiles: z.number().int().min(0).max(1000000).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const vehicleIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const customerIdParamSchema = z.object({
  customerId: z.coerce.number().int().positive(),
});

export const vehicleQuerySchema = z
  .object({
    registration: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
