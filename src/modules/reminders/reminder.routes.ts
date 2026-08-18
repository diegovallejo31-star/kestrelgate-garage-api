import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { ReminderController } from './reminder.controller';
import { ReminderRepository } from './reminder.repository';
import {
  createReminderSchema,
  reminderIdParamSchema,
  reminderQuerySchema,
  reminderStatusSchema,
  vehicleIdParamSchema,
} from './reminder.schema';
import { ReminderService } from './reminder.service';

function controllerFor(db: Database): ReminderController {
  return new ReminderController(
    new ReminderService(new ReminderRepository(db), new VehicleRepository(db)),
  );
}

/** The reminders of one vehicle, mounted under /vehicles. */
export function createVehicleReminderRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:vehicleId/reminders',
    validateRequest({ params: vehicleIdParamSchema, body: createReminderSchema }),
    controller.create,
  );
  router.get(
    '/:vehicleId/reminders',
    validateRequest({ params: vehicleIdParamSchema, query: reminderQuerySchema }),
    controller.list,
  );

  return router;
}

export function createReminderRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: reminderIdParamSchema }),
    controller.getById,
  );
  router.post(
    '/:id/status',
    validateRequest({ params: reminderIdParamSchema, body: reminderStatusSchema }),
    controller.changeStatus,
  );

  return router;
}
