import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { PartController } from './part.controller';
import { PartRepository } from './part.repository';
import {
  createPartSchema,
  partIdParamSchema,
  partQuerySchema,
  updatePartSchema,
} from './part.schema';
import { PartService } from './part.service';

function controllerFor(db: Database): PartController {
  return new PartController(new PartService(new PartRepository(db)));
}

export function createPartRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post('/', validateRequest({ body: createPartSchema }), controller.create);
  router.get('/', validateRequest({ query: partQuerySchema }), controller.list);
  router.get('/:id', validateRequest({ params: partIdParamSchema }), controller.getById);
  router.patch(
    '/:id',
    validateRequest({ params: partIdParamSchema, body: updatePartSchema }),
    controller.update,
  );

  return router;
}
