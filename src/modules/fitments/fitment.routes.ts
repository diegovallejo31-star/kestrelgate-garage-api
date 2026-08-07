import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { JobRepository } from '../jobs/job.repository';
import { PartRepository } from '../parts/part.repository';
import { FitmentController } from './fitment.controller';
import { FitmentRepository } from './fitment.repository';
import {
  createFitmentSchema,
  fitmentIdParamSchema,
  fitmentQuerySchema,
  jobIdParamSchema,
} from './fitment.schema';
import { FitmentService } from './fitment.service';

function controllerFor(db: Database): FitmentController {
  return new FitmentController(
    new FitmentService(
      new FitmentRepository(db),
      new JobRepository(db),
      new PartRepository(db),
    ),
  );
}

/** The fitments of one job, mounted under /jobs. */
export function createJobFitmentRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:jobId/fitments',
    validateRequest({ params: jobIdParamSchema, body: createFitmentSchema }),
    controller.create,
  );
  router.get(
    '/:jobId/fitments',
    validateRequest({ params: jobIdParamSchema, query: fitmentQuerySchema }),
    controller.list,
  );

  return router;
}

export function createFitmentRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: fitmentIdParamSchema }),
    controller.getById,
  );

  return router;
}
