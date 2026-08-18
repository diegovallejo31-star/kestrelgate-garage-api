import { z } from 'zod';
import { dayString } from '../../lib/schemas';
import { SUPPLIER_ORDER_STATUSES } from './supplierOrder.types';

export const createSupplierOrderSchema = z
  .object({
    reference: z.string().min(1).max(120),
    orderedOn: dayString,
    quantity: z.number().int().min(1).max(10000),
  })
  .strict();

export const supplierOrderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export const partIdParamSchema = z.object({ partId: z.coerce.number().int().positive() });

export const supplierOrderQuerySchema = z
  .object({
    status: z.enum(SUPPLIER_ORDER_STATUSES as [string, ...string[]]).optional(),
    reference: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const supplierOrderStatusSchema = z
  .object({ status: z.enum(['received', 'cancelled']) })
  .strict();
