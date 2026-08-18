import type { Request, Response } from 'express';
import type { ReminderService } from './reminder.service';
import type { ReminderStatus } from './reminder.types';

export class ReminderController {
  constructor(private readonly service: ReminderService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.vehicleId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { status, kind, limit, offset } = req.query as unknown as {
      status?: ReminderStatus;
      kind?: 'mot_due' | 'service_due' | 'recall';
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.vehicleId),
        { status, kind },
        limit,
        offset,
      ),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  changeStatus = (req: Request, res: Response): void => {
    const { status } = req.body as { status: Exclude<ReminderStatus, 'scheduled'> };
    res.json(this.service.changeStatus(Number(req.params.id), status));
  };
}
