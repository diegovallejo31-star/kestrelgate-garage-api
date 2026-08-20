import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { SiteRepository } from '../sites/site.repository';
import { CourtesyCarController } from './courtesyCar.controller';
import { CourtesyCarRepository } from './courtesyCar.repository';
import {
  courtesyCarIdParamSchema,
  courtesyCarQuerySchema,
  courtesyCarStatusSchema,
  createCourtesyCarSchema,
  siteIdParamSchema,
  updateCourtesyCarSchema,
} from './courtesyCar.schema';
import { CourtesyCarService } from './courtesyCar.service';

function controllerFor(db: Database): CourtesyCarController {
  return new CourtesyCarController(
    new CourtesyCarService(new CourtesyCarRepository(db), new SiteRepository(db)),
  );
}

/** The courtesy_cars of one site, mounted under /sites. */
export function createSiteCourtesyCarRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:siteId/courtesy-cars',
    validateRequest({ params: siteIdParamSchema, body: createCourtesyCarSchema }),
    controller.create,
  );
  router.get(
    '/:siteId/courtesy-cars',
    validateRequest({ params: siteIdParamSchema, query: courtesyCarQuerySchema }),
    controller.list,
  );

  return router;
}

export function createCourtesyCarRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: courtesyCarIdParamSchema }),
    controller.getById,
  );
  router.patch(
    '/:id',
    validateRequest({ params: courtesyCarIdParamSchema, body: updateCourtesyCarSchema }),
    controller.update,
  );
  router.post(
    '/:id/status',
    validateRequest({ params: courtesyCarIdParamSchema, body: courtesyCarStatusSchema }),
    controller.changeStatus,
  );

  return router;
}
