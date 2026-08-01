import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { CustomerRepository } from '../customers/customer.repository';
import { VehicleController } from './vehicle.controller';
import { VehicleRepository } from './vehicle.repository';
import {
  createVehicleSchema,
  customerIdParamSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  vehicleQuerySchema,
} from './vehicle.schema';
import { VehicleService } from './vehicle.service';

function controllerFor(db: Database): VehicleController {
  return new VehicleController(
    new VehicleService(new VehicleRepository(db), new CustomerRepository(db)),
  );
}

/** The vehicles of one customer, mounted under /customers. */
export function createCustomerVehicleRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:customerId/vehicles',
    validateRequest({ params: customerIdParamSchema, body: createVehicleSchema }),
    controller.create,
  );
  router.get(
    '/:customerId/vehicles',
    validateRequest({ params: customerIdParamSchema, query: vehicleQuerySchema }),
    controller.list,
  );

  return router;
}

export function createVehicleRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: vehicleIdParamSchema }),
    controller.getById,
  );
  router.patch(
    '/:id',
    validateRequest({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
    controller.update,
  );

  return router;
}
