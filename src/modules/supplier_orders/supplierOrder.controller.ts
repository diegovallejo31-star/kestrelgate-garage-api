import type { Request, Response } from 'express';
import type { SupplierOrderService } from './supplierOrder.service';
import type { SupplierOrderStatus } from './supplierOrder.types';

export class SupplierOrderController {
  constructor(private readonly service: SupplierOrderService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(Number(req.params.partId), req.body));
  };

  list = (req: Request, res: Response): void => {
    const { status, reference, limit, offset } = req.query as unknown as {
      status?: SupplierOrderStatus;
      reference?: string;
      limit?: number;
      offset?: number;
    };
    res.json({
      items: this.service.list(
        Number(req.params.partId),
        { status, reference },
        limit,
        offset,
      ),
    });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  changeStatus = (req: Request, res: Response): void => {
    const { status } = req.body as { status: Exclude<SupplierOrderStatus, 'ordered'> };
    res.json(this.service.changeStatus(Number(req.params.id), status));
  };
}
