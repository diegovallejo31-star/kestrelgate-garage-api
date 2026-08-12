import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { bpsOf } from '../../lib/money';
import { BookingRepository } from '../bookings/booking.repository';
import { FitmentRepository } from '../fitments/fitment.repository';
import { JobRepository } from '../jobs/job.repository';
import type { InvoiceFilter, InvoiceRepository } from './invoice.repository';
import type { Invoice, InvoiceDraft } from './invoice.types';

/** VAT at the standard rate, in basis points. */
const VAT_BASIS_POINTS = 2000;

/** No booking has more lines on it than this. */
const EVERYTHING = { limit: 1000, offset: 0 };

/**
 * Invoices.
 *
 * The totals are read out of the jobs and fitments once, at the moment the
 * invoice is raised, and then never recomputed. That is the whole point: a
 * technician correcting a labour line next week must not change a figure the
 * customer has already been given.
 *
 * VAT is taken on the net rather than line by line, so the rounding happens
 * once and the three columns always add back up.
 */
export class InvoiceService {
  constructor(
    private readonly repo: InvoiceRepository,
    private readonly bookings: BookingRepository,
    private readonly jobs: JobRepository,
    private readonly fitments: FitmentRepository,
  ) {}

  create(input: InvoiceDraft): Invoice {
    const booking = this.bookings.findById(input.bookingId);
    if (!booking) throw new NotFoundError('booking', input.bookingId);
    if (booking.status !== 'completed') {
      throw new ConflictError(
        `booking ${input.bookingId} is ${booking.status}, not completed`,
      );
    }
    if (this.repo.findByBookingId(input.bookingId)) {
      throw new ConflictError(`booking ${input.bookingId} has already been invoiced`);
    }
    if (this.repo.findByNumber(input.number)) {
      throw new ConflictError(`invoice ${input.number} already exists`);
    }

    const jobs = this.jobs.list(input.bookingId, EVERYTHING, {});
    const labourPence = jobs.reduce((total, job) => total + job.labourPence, 0);
    const partsPence = jobs.reduce(
      (total, job) =>
        total +
        this.fitments
          .list(job.id, EVERYTHING, {})
          .reduce((lines, fitment) => lines + fitment.linePence, 0),
      0,
    );

    const netPence = labourPence + partsPence;
    const vatPence = bpsOf(netPence, VAT_BASIS_POINTS);

    return this.repo.create({
      ...input,
      labourPence,
      partsPence,
      netPence,
      vatPence,
      grossPence: netPence + vatPence,
    });
  }

  list(filter: InvoiceFilter, limit?: number, offset?: number): Invoice[] {
    return this.repo.list(pageFrom(limit, offset), filter);
  }

  getById(id: number): Invoice {
    const invoice = this.repo.findById(id);
    if (!invoice) throw new NotFoundError('invoice', id);
    return invoice;
  }
}
