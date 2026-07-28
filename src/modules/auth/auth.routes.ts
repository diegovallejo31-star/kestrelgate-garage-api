import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { AuthController } from './auth.controller';
import { registerSchema, signInSchema } from './auth.schema';
import { AuthService } from './auth.service';

export function createAuthRouter(db: Database): { router: Router; service: AuthService } {
  const service = new AuthService(db);
  const controller = new AuthController(service);
  const router = Router();

  router.post(
    '/register',
    validateRequest({ body: registerSchema }),
    controller.register,
  );
  router.post('/sign-in', validateRequest({ body: signInSchema }), controller.signIn);
  router.get('/me', controller.whoAmI);
  router.post('/sign-out', controller.signOut);

  return { router, service };
}
