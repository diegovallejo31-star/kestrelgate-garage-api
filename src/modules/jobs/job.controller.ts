import type { Request, Response } from 'express';
import type { JobService } from './job.service';
import type { JobStatus } from './job.types';

export class JobController {
  constructor(private readonly service: JobService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.bookingId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { status, technicianId, limit, offset } = req.query as unknown as {
      status?: JobStatus;
      technicianId?: number;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.bookingId),
        { status, technicianId },
        limit,
        offset,
      ),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  changeStatus = (req: Request, res: Response): void => {
    const { status } = req.body as { status: JobStatus };
    res.json(this.service.changeStatus(Number(req.params.id), status));
  };
}
