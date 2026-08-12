import type { Request, Response } from 'express';
import type { InvoiceService } from './invoice.service';

export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(req.body));
  };

  list = (req: Request, res: Response): void => {
    const { bookingId, number, limit, offset } = req.query as unknown as {
      bookingId?: number;
      number?: string;
      limit?: number;
      offset?: number;
    };
    res.json({ items: this.service.list({ bookingId, number }, limit, offset) });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };
}
