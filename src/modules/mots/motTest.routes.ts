import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { MotTestController } from './motTest.controller';
import { MotTestRepository } from './motTest.repository';
import {
  createMotTestSchema,
  motTestIdParamSchema,
  motTestQuerySchema,
  vehicleIdParamSchema,
} from './motTest.schema';
import { MotTestService } from './motTest.service';

function controllerFor(db: Database): MotTestController {
  return new MotTestController(
    new MotTestService(new MotTestRepository(db), new VehicleRepository(db)),
  );
}

/** The mots of one vehicle, mounted under /vehicles. */
export function createVehicleMotTestRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:vehicleId/mot-tests',
    validateRequest({ params: vehicleIdParamSchema, body: createMotTestSchema }),
    controller.create,
  );
  router.get(
    '/:vehicleId/mot-tests',
    validateRequest({ params: vehicleIdParamSchema, query: motTestQuerySchema }),
    controller.list,
  );

  return router;
}

export function createMotTestRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: motTestIdParamSchema }),
    controller.getById,
  );

  return router;
}
