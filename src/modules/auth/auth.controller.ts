import type { Request, Response } from 'express';
import { UnauthorisedError } from '../../lib/AppError';
import type { AuthService } from './auth.service';

/** Reads the bearer token off a request, or throws. */
function bearer(req: Request): string {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) throw new UnauthorisedError('A session token is required');
  return token;
}

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = (req: Request, res: Response): void => {
    const { email, fullName, password, role } = req.body;
    res.status(201).json(this.service.register(email, fullName, password, role));
  };

  signIn = (req: Request, res: Response): void => {
    res.json(this.service.signIn(req.body.email, req.body.password));
  };

  whoAmI = (req: Request, res: Response): void => {
    res.json(this.service.whoIs(bearer(req)));
  };

  signOut = (req: Request, res: Response): void => {
    this.service.signOut(bearer(req));
    res.status(204).send();
  };
}
