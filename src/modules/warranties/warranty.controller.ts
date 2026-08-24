import type { Request, Response } from 'express';
import type { WarrantyService } from './warranty.service';
import type { WarrantyStatus } from './warranty.types';

export class WarrantyController {
  constructor(private readonly service: WarrantyService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.jobId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { status, reference, limit, offset } = req.query as unknown as {
      status?: WarrantyStatus;
      reference?: string;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.jobId),
        { status, reference },
        limit,
        offset,
      ),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  claim = (req: Request, res: Response): void => {
    const { claimedOn } = req.body as { claimedOn: string };
    res.json(this.service.claim(Number(req.params.id), claimedOn));
  };
}
