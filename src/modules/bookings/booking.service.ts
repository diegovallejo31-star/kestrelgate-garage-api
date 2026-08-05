import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { SiteRepository } from '../sites/site.repository';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import type { BookingFilter, BookingRepository } from './booking.repository';
import type { Booking, BookingPatch, BookingStatus, NewBooking } from './booking.types';

const NEXT: Record<BookingStatus, BookingStatus[]> = {
  booked: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_parts', 'completed', 'cancelled'],
  awaiting_parts: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Bookings.
 *
 * The status moves along a short path and never back: a booking that has been
 * completed is what the invoice was raised against, and one that was cancelled
 * is what the customer was told. Reopening either would change a number
 * somebody has already been given, so the answer is a new booking instead.
 */
export class BookingService {
  constructor(
    private readonly repo: BookingRepository,
    private readonly vehicles: VehicleRepository,
    private readonly sites: SiteRepository,
  ) {}

  create(vehicleId: number, input: Omit<NewBooking, 'vehicleId'>): Booking {
    if (!this.vehicles.findById(vehicleId)) {
      throw new NotFoundError('vehicle', vehicleId);
    }
    if (!this.sites.findById(input.siteId)) {
      throw new NotFoundError('site', input.siteId);
    }
    return this.repo.create({ ...input, vehicleId });
  }

  list(
    vehicleId: number,
    filter: BookingFilter,
    limit?: number,
    offset?: number,
  ): Booking[] {
    if (!this.vehicles.findById(vehicleId)) {
      throw new NotFoundError('vehicle', vehicleId);
    }
    return this.repo.list(vehicleId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Booking {
    const booking = this.repo.findById(id);
    if (!booking) throw new NotFoundError('booking', id);
    return booking;
  }

  update(id: number, patch: BookingPatch): Booking {
    this.getById(id);
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('booking', id);
    return updated;
  }

  changeStatus(id: number, next: BookingStatus): Booking {
    const booking = this.getById(id);
    if (!NEXT[booking.status].includes(next)) {
      throw new ConflictError(`a booking cannot go from ${booking.status} to ${next}`);
    }
    const moved = this.repo.setStatus(id, next);
    if (!moved) throw new NotFoundError('booking', id);
    return moved;
  }
}
