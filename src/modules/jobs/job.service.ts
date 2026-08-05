import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { BookingRepository } from '../bookings/booking.repository';
import { TechnicianRepository } from '../technicians/technician.repository';
import type { JobFilter, JobRepository } from './job.repository';
import type { Job, JobDraft, JobStatus } from './job.types';

/**
 * Work lines.
 *
 * The labour charge is worked out here rather than read back off the
 * technician when the invoice is raised. It is the same arithmetic either way
 * on the day, and a different answer six weeks later - which is the whole
 * reason for holding it.
 */
export class JobService {
  constructor(
    private readonly repo: JobRepository,
    private readonly bookings: BookingRepository,
    private readonly technicians: TechnicianRepository,
  ) {}

  create(bookingId: number, input: JobDraft): Job {
    const booking = this.bookings.findById(bookingId);
    if (!booking) throw new NotFoundError('booking', bookingId);
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new ConflictError(
        `booking ${bookingId} is ${booking.status}; nothing more goes on it`,
      );
    }

    const technician = this.technicians.findById(input.technicianId);
    if (!technician) throw new NotFoundError('technician', input.technicianId);

    const labourPence = Math.round(
      (technician.labourRatePence * input.labourTenths) / 10,
    );
    return this.repo.create({ ...input, bookingId, labourPence });
  }

  list(bookingId: number, filter: JobFilter, limit?: number, offset?: number): Job[] {
    if (!this.bookings.findById(bookingId)) {
      throw new NotFoundError('booking', bookingId);
    }
    return this.repo.list(bookingId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Job {
    const job = this.repo.findById(id);
    if (!job) throw new NotFoundError('job', id);
    return job;
  }

  changeStatus(id: number, next: JobStatus): Job {
    const job = this.getById(id);
    if (job.status === 'done' && next === 'open') {
      throw new ConflictError('a job that has been signed off cannot be reopened');
    }
    const moved = this.repo.setStatus(id, next);
    if (!moved) throw new NotFoundError('job', id);
    return moved;
  }

  /** What the labour on one booking comes to, ignoring parts. */
  labourTotal(bookingId: number): number {
    return this.repo
      .list(bookingId, { limit: 1000, offset: 0 }, {})
      .reduce((total, job) => total + job.labourPence, 0);
  }
}
