import type { Request, Response } from 'express';
import type { VehicleService } from './vehicle.service';

export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.customerId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { registration, limit, offset } = req.query as unknown as {
      registration?: string;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.customerId),
        { registration },
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
}
