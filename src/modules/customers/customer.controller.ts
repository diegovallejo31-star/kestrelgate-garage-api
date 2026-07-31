import type { Request, Response } from 'express';
import type { CustomerService } from './customer.service';

export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  create = (req: Request, res: Response): void => {
    res.status(201).json(this.service.create(req.body));
  };

  list = (req: Request, res: Response): void => {
    const { accountRef, onAccount, limit, offset } = req.query as unknown as {
      accountRef?: string;
      onAccount?: boolean;
      limit?: number;
      offset?: number;
    };
    res.json({ items: this.service.list({ accountRef, onAccount }, limit, offset) });
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.service.getById(Number(req.params.id)));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.service.update(Number(req.params.id), req.body));
  };
}
