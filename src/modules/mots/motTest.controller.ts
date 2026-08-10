import type { Request, Response } from 'express';
import type { MotTestService } from './motTest.service';

export class MotTestController {
  constructor(private readonly service: MotTestService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.vehicleId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { certificateNumber, limit, offset } = req.query as unknown as {
      certificateNumber?: string;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.vehicleId),
        { certificateNumber },
        limit,
        offset,
      ),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };
}
