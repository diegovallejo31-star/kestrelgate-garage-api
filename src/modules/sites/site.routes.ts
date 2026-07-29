import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { SiteController } from './site.controller';
import { SiteRepository } from './site.repository';
import {
  createSiteSchema,
  siteIdParamSchema,
  siteQuerySchema,
  updateSiteSchema,
} from './site.schema';
import { SiteService } from './site.service';

function controllerFor(db: Database): SiteController {
  return new SiteController(new SiteService(new SiteRepository(db)));
}

export function createSiteRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post('/', validateRequest({ body: createSiteSchema }), controller.create);
  router.get('/', validateRequest({ query: siteQuerySchema }), controller.list);
  router.get('/:id', validateRequest({ params: siteIdParamSchema }), controller.getById);
  router.patch(
    '/:id',
    validateRequest({ params: siteIdParamSchema, body: updateSiteSchema }),
    controller.update,
  );

  return router;
}
