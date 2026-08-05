import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { BookingRepository } from '../bookings/booking.repository';
import { TechnicianRepository } from '../technicians/technician.repository';
import { JobController } from './job.controller';
import { JobRepository } from './job.repository';
import {
  bookingIdParamSchema,
  createJobSchema,
  jobIdParamSchema,
  jobQuerySchema,
  jobStatusSchema,
} from './job.schema';
import { JobService } from './job.service';

function controllerFor(db: Database): JobController {
  return new JobController(
    new JobService(
      new JobRepository(db),
      new BookingRepository(db),
      new TechnicianRepository(db),
    ),
  );
}

/** The jobs of one booking, mounted under /bookings. */
export function createBookingJobRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:bookingId/jobs',
    validateRequest({ params: bookingIdParamSchema, body: createJobSchema }),
    controller.create,
  );
  router.get(
    '/:bookingId/jobs',
    validateRequest({ params: bookingIdParamSchema, query: jobQuerySchema }),
    controller.list,
  );

  return router;
}

export function createJobRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get('/:id', validateRequest({ params: jobIdParamSchema }), controller.getById);
  router.post(
    '/:id/status',
    validateRequest({ params: jobIdParamSchema, body: jobStatusSchema }),
    controller.changeStatus,
  );

  return router;
}
