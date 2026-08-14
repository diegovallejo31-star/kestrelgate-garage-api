import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { InvoiceRepository } from '../invoices/invoice.repository';
import type { PaymentFilter, PaymentRepository } from './payment.repository';
import type { NewPayment, Payment } from './payment.types';

/**
 * Payments.
 *
 * The rule that matters is the one the schema cannot see: the sum of payments
 * against an invoice may reach its gross and never pass it. Overpayment is a
 * refund waiting to happen, and a garage would rather refuse the extra tenner
 * at the counter than raise a credit note for it later.
 */
export class PaymentService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly invoices: InvoiceRepository,
  ) {}

  create(input: NewPayment): Payment {
    const invoice = this.invoices.findById(input.invoiceId);
    if (!invoice) throw new NotFoundError('invoice', input.invoiceId);

    const alreadyPaid = this.repo
      .forInvoice(input.invoiceId)
      .reduce((total, payment) => total + payment.amountPence, 0);
    if (alreadyPaid + input.amountPence > invoice.grossPence) {
      const left = invoice.grossPence - alreadyPaid;
      throw new ConflictError(
        `only ${left} pence outstanding on invoice ${invoice.number}, ${input.amountPence} offered`,
      );
    }

    return this.repo.create(input);
  }

  list(filter: PaymentFilter, limit?: number, offset?: number): Payment[] {
    return this.repo.list(pageFrom(limit, offset), filter);
  }

  getById(id: number): Payment {
    const payment = this.repo.findById(id);
    if (!payment) throw new NotFoundError('payment', id);
    return payment;
  }

  /** Gross, received and remaining on one invoice. */
  outstanding(invoiceId: number): {
    invoiceId: number;
    grossPence: number;
    paidPence: number;
    outstandingPence: number;
  } {
    const invoice = this.invoices.findById(invoiceId);
    if (!invoice) throw new NotFoundError('invoice', invoiceId);
    const paidPence = this.repo
      .forInvoice(invoiceId)
      .reduce((total, payment) => total + payment.amountPence, 0);
    return {
      invoiceId,
      grossPence: invoice.grossPence,
      paidPence,
      outstandingPence: invoice.grossPence - paidPence,
    };
  }
}
