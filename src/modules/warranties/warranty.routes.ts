import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { JobRepository } from '../jobs/job.repository';
import { WarrantyController } from './warranty.controller';
import { WarrantyRepository } from './warranty.repository';
import {
  createWarrantySchema,
  jobIdParamSchema,
  warrantyClaimSchema,
  warrantyIdParamSchema,
  warrantyQuerySchema,
} from './warranty.schema';
import { WarrantyService } from './warranty.service';

function controllerFor(db: Database): WarrantyController {
  return new WarrantyController(
    new WarrantyService(new WarrantyRepository(db), new JobRepository(db)),
  );
}

/** The warranties of one job, mounted under /jobs. */
export function createJobWarrantyRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:jobId/warranties',
    validateRequest({ params: jobIdParamSchema, body: createWarrantySchema }),
    controller.create,
  );
  router.get(
    '/:jobId/warranties',
    validateRequest({ params: jobIdParamSchema, query: warrantyQuerySchema }),
    controller.list,
  );

  return router;
}

export function createWarrantyRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: warrantyIdParamSchema }),
    controller.getById,
  );
  router.post(
    '/:id/claim',
    validateRequest({ params: warrantyIdParamSchema, body: warrantyClaimSchema }),
    controller.claim,
  );

  return router;
}
