import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { BookingRepository } from '../bookings/booking.repository';
import { FitmentRepository } from '../fitments/fitment.repository';
import { JobRepository } from '../jobs/job.repository';
import { InvoiceController } from './invoice.controller';
import { InvoiceRepository } from './invoice.repository';
import {
  createInvoiceSchema,
  invoiceIdParamSchema,
  invoiceQuerySchema,
} from './invoice.schema';
import { InvoiceService } from './invoice.service';

function controllerFor(db: Database): InvoiceController {
  return new InvoiceController(
    new InvoiceService(
      new InvoiceRepository(db),
      new BookingRepository(db),
      new JobRepository(db),
      new FitmentRepository(db),
    ),
  );
}

export function createInvoiceRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post('/', validateRequest({ body: createInvoiceSchema }), controller.create);
  router.get('/', validateRequest({ query: invoiceQuerySchema }), controller.list);
  router.get(
    '/:id',
    validateRequest({ params: invoiceIdParamSchema }),
    controller.getById,
  );

  return router;
}
