import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { CustomerController } from './customer.controller';
import { CustomerRepository } from './customer.repository';
import {
  createCustomerSchema,
  customerIdParamSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from './customer.schema';
import { CustomerService } from './customer.service';

function controllerFor(db: Database): CustomerController {
  return new CustomerController(new CustomerService(new CustomerRepository(db)));
}

export function createCustomerRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post('/', validateRequest({ body: createCustomerSchema }), controller.create);
  router.get('/', validateRequest({ query: customerQuerySchema }), controller.list);
  router.get(
    '/:id',
    validateRequest({ params: customerIdParamSchema }),
    controller.getById,
  );
  router.patch(
    '/:id',
    validateRequest({ params: customerIdParamSchema, body: updateCustomerSchema }),
    controller.update,
  );

  return router;
}
