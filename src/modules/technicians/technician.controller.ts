import type { Request, Response } from 'express';
import type { TechnicianService } from './technician.service';

export class TechnicianController {
  constructor(private readonly service: TechnicianService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.siteId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { clockNumber, limit, offset } = req.query as unknown as {
      clockNumber?: string;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(Number(req.params.siteId), { clockNumber }, limit, offset),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.service.update(Number(req.params.id), req.body));
  };
}
