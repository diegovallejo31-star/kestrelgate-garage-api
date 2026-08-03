import type { Request, Response } from 'express';
import type { PartService } from './part.service';

export class PartController {
  constructor(private readonly service: PartService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(req.body));
  };

  list = (req: Request, res: Response): void => {
    const { partNumber, limit, offset } = req.query as unknown as {
      partNumber?: string;
      limit?: number;
      offset?: number;
    };
    res.json({ items: this.service.list({ partNumber }, limit, offset) });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.service.update(Number(req.params.id), req.body));
  };
}
