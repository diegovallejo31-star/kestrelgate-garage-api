import type { Request, Response } from 'express';
import type { BookingService } from './booking.service';
import type { BookingStatus } from './booking.types';

export class BookingController {
  constructor(private readonly service: BookingService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.vehicleId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { status, siteId, limit, offset } = req.query as unknown as {
      status?: BookingStatus;
      siteId?: number;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.vehicleId),
        { status, siteId },
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
    const { status } = req.body as { status: BookingStatus };
    res.json(this.service.changeStatus(Number(req.params.id), status));
  };
}
