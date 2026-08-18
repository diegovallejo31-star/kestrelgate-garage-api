import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import type { ReminderFilter, ReminderRepository } from './reminder.repository';
import type { Reminder, ReminderDraft, ReminderStatus } from './reminder.types';

/**
 * Reminders.
 *
 * A reminder is raised scheduled and leaves that state exactly once, to sent or
 * to dismissed, and never comes back. The desk works off the scheduled ones, so
 * a reminder that has been dealt with has to drop out of that list for good -
 * re-sending is a new reminder, not a revival of the old one.
 */
export class ReminderService {
  constructor(
    private readonly repo: ReminderRepository,
    private readonly vehicles: VehicleRepository,
  ) {}

  create(vehicleId: number, input: ReminderDraft): Reminder {
    if (!this.vehicles.findById(vehicleId)) {
      throw new NotFoundError('vehicle', vehicleId);
    }
    return this.repo.create({ ...input, vehicleId });
  }

  list(
    vehicleId: number,
    filter: ReminderFilter,
    limit?: number,
    offset?: number,
  ): Reminder[] {
    if (!this.vehicles.findById(vehicleId)) {
      throw new NotFoundError('vehicle', vehicleId);
    }
    return this.repo.list(vehicleId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Reminder {
    const reminder = this.repo.findById(id);
    if (!reminder) throw new NotFoundError('reminder', id);
    return reminder;
  }

  changeStatus(id: number, next: Exclude<ReminderStatus, 'scheduled'>): Reminder {
    const reminder = this.getById(id);
    if (reminder.status !== 'scheduled') {
      throw new ConflictError(
        `reminder ${id} is already ${reminder.status} and cannot be changed again`,
      );
    }
    const moved = this.repo.setStatus(id, next);
    if (!moved) throw new NotFoundError('reminder', id);
    return moved;
  }
}
