import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { SiteRepository } from '../sites/site.repository';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { BookingController } from './booking.controller';
import { BookingRepository } from './booking.repository';
import {
  bookingIdParamSchema,
  bookingQuerySchema,
  bookingStatusSchema,
  createBookingSchema,
  updateBookingSchema,
  vehicleIdParamSchema,
} from './booking.schema';
import { BookingService } from './booking.service';

function controllerFor(db: Database): BookingController {
  return new BookingController(
    new BookingService(
      new BookingRepository(db),
      new VehicleRepository(db),
      new SiteRepository(db),
    ),
  );
}

/** The bookings of one vehicle, mounted under /vehicles. */
export function createVehicleBookingRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:vehicleId/bookings',
    validateRequest({ params: vehicleIdParamSchema, body: createBookingSchema }),
    controller.create,
  );
  router.get(
    '/:vehicleId/bookings',
    validateRequest({ params: vehicleIdParamSchema, query: bookingQuerySchema }),
    controller.list,
  );

  return router;
}

export function createBookingRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: bookingIdParamSchema }),
    controller.getById,
  );
  router.patch(
    '/:id',
    validateRequest({ params: bookingIdParamSchema, body: updateBookingSchema }),
    controller.update,
  );
  router.post(
    '/:id/status',
    validateRequest({ params: bookingIdParamSchema, body: bookingStatusSchema }),
    controller.changeStatus,
  );

  return router;
}
