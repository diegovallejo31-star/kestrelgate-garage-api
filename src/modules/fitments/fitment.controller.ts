import type { Request, Response } from 'express';
import type { FitmentService } from './fitment.service';

export class FitmentController {
  constructor(private readonly service: FitmentService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.jobId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { partId, limit, offset } = req.query as unknown as {
      partId?: number;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(Number(req.params.jobId), { partId }, limit, offset),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };
}
