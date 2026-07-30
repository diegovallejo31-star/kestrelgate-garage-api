import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { SiteRepository } from '../sites/site.repository';
import { TechnicianController } from './technician.controller';
import { TechnicianRepository } from './technician.repository';
import {
  createTechnicianSchema,
  siteIdParamSchema,
  technicianIdParamSchema,
  technicianQuerySchema,
  updateTechnicianSchema,
} from './technician.schema';
import { TechnicianService } from './technician.service';

function controllerFor(db: Database): TechnicianController {
  return new TechnicianController(
    new TechnicianService(new TechnicianRepository(db), new SiteRepository(db)),
  );
}

/** The technicians of one site, mounted under /sites. */
export function createSiteTechnicianRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post(
    '/:siteId/technicians',
    validateRequest({ params: siteIdParamSchema, body: createTechnicianSchema }),
    controller.create,
  );
  router.get(
    '/:siteId/technicians',
    validateRequest({ params: siteIdParamSchema, query: technicianQuerySchema }),
    controller.list,
  );

  return router;
}

export function createTechnicianRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.get(
    '/:id',
    validateRequest({ params: technicianIdParamSchema }),
    controller.getById,
  );
  router.patch(
    '/:id',
    validateRequest({ params: technicianIdParamSchema, body: updateTechnicianSchema }),
    controller.update,
  );

  return router;
}
