import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { ApiKeyService } from './apiKey.service';

const issueSchema = z.object({ label: z.string().min(2).max(80) }).strict();
const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export function createApiKeyRouter(db: Database): Router {
  const service = new ApiKeyService(db);
  const router = Router();

  router.post('/', validateRequest({ body: issueSchema }), (req, res) => {
    res.status(201).json(service.issue(req.body.label));
  });

  router.get('/', (_req, res) => {
    res.json({ items: service.list() });
  });

  router.post('/:id/revoke', validateRequest({ params: idParamSchema }), (req, res) => {
    res.json(service.revoke(Number(req.params.id), new Date().toISOString()));
  });

  return router;
}
