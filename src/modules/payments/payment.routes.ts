import { Router } from 'express';
import type { Database } from '../../db/client';
import { validateRequest } from '../../middleware/validateRequest';
import { InvoiceRepository } from '../invoices/invoice.repository';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import {
  createPaymentSchema,
  invoiceIdOutstandingParamSchema,
  paymentIdParamSchema,
  paymentQuerySchema,
} from './payment.schema';
import { PaymentService } from './payment.service';

function controllerFor(db: Database): PaymentController {
  return new PaymentController(
    new PaymentService(new PaymentRepository(db), new InvoiceRepository(db)),
  );
}

export function createPaymentRouter(db: Database): Router {
  const router = Router();
  const controller = controllerFor(db);

  router.post('/', validateRequest({ body: createPaymentSchema }), controller.create);
  router.get('/', validateRequest({ query: paymentQuerySchema }), controller.list);
  router.get(
    '/:id',
    validateRequest({ params: paymentIdParamSchema }),
    controller.getById,
  );
  router.get(
    '/invoice/:invoiceId/outstanding',
    validateRequest({ params: invoiceIdOutstandingParamSchema }),
    controller.outstanding,
  );

  return router;
}
