import type { Request, Response } from 'express';
import type { PaymentService } from './payment.service';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(req.body));
  };

  list = (req: Request, res: Response): void => {
    const { invoiceId, method, limit, offset } = req.query as unknown as {
      invoiceId?: number;
      method?: 'card' | 'cash' | 'bank_transfer' | 'account';
      limit?: number;
      offset?: number;
    };
    res.json({ items: this.service.list({ invoiceId, method }, limit, offset) });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  outstanding = (req: Request, res: Response): void => {
    res.json(this.service.outstanding(Number(req.params.invoiceId)));
  };
}
