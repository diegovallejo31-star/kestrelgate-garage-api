import type { Request, Response } from 'express';
import type { CourtesyCarService } from './courtesyCar.service';
import type { CourtesyCarStatus } from './courtesyCar.types';

export class CourtesyCarController {
  constructor(private readonly service: CourtesyCarService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.siteId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { status, registration, limit, offset } = req.query as unknown as {
      status?: CourtesyCarStatus;
      registration?: string;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.siteId),
        { status, registration },
        limit,
        offset,
      ),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.service.update(Number(req.params.id), req.body));
  };

  changeStatus = (req: Request, res: Response): void => {
    const { status } = req.body as { status: CourtesyCarStatus };
    res.json(this.service.changeStatus(Number(req.params.id), status));
  };
}
