import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { PartRepository } from '../parts/part.repository';
import { SupplierOrderController } from './supplierOrder.controller';
import { SupplierOrderRepository } from './supplierOrder.repository';
import {
  createSupplierOrderSchema,
  partIdParamSchema,
  supplierOrderIdParamSchema,
  supplierOrderQuerySchema,
  supplierOrderStatusSchema,
} from './supplierOrder.schema';
import { SupplierOrderService } from './supplierOrder.service';

function controllerFor(db: Database): SupplierOrderController {
  return new SupplierOrderController(
    new SupplierOrderService(new SupplierOrderRepository(db), new PartRepository(db)),
  );
}

/** The supplier_orders of one part, mounted under /parts. */
export function createPartSupplierOrderRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:partId/orders',
    validateRequest({ params: partIdParamSchema, body: createSupplierOrderSchema }),
    controller.create,
  );
  router.get(
    '/:partId/orders',
    validateRequest({ params: partIdParamSchema, query: supplierOrderQuerySchema }),
    controller.list,
  );

  return router;
}

export function createSupplierOrderRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: supplierOrderIdParamSchema }),
    controller.getById,
  );
  router.post(
    '/:id/status',
    validateRequest({
      params: supplierOrderIdParamSchema,
      body: supplierOrderStatusSchema,
    }),
    controller.changeStatus,
  );

  return router;
}
