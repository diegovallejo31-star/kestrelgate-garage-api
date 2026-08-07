import { z } from 'zod';
import { dayString } from '../../lib/schemas';

export const createMotTestSchema = z
  .object({
    certificateNumber: z.string().min(1).max(120),
    testedOn: dayString,
    result: z.enum(['pass', 'fail']),
    odometerMiles: z.number().int().min(0).max(1000000),
    expiresOn: dayString.optional(),
  })
  .strict();

export const motTestIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const vehicleIdParamSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
});

export const motTestQuerySchema = z
  .object({
    certificateNumber: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
