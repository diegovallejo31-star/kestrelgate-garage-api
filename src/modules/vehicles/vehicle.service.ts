import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { CustomerRepository } from '../customers/customer.repository';
import type { VehicleFilter, VehicleRepository } from './vehicle.repository';
import type { NewVehicle, Vehicle, VehiclePatch } from './vehicle.types';

/**
 * Vehicles.
 *
 * Two rules that look alike and are not: the registration is unique across the
 * group rather than within an account, and the odometer only goes up. The
 * second one is here rather than in the schema because the number that arrives
 * from a technician's handset is often a mistyped one, and refusing it is
 * cheaper than explaining a car that has done 91,000 miles and then 19,000.
 */
export class VehicleService {
  constructor(
    private readonly repo: VehicleRepository,
    private readonly customers: CustomerRepository,
  ) {}

  create(customerId: number, input: Omit<NewVehicle, 'customerId'>): Vehicle {
    if (!this.customers.findById(customerId)) {
      throw new NotFoundError('customer', customerId);
    }
    if (this.repo.findByRegistration(input.registration)) {
      throw new ConflictError(`${input.registration} is already on the system`);
    }
    return this.repo.create({ ...input, customerId });
  }

  list(
    customerId: number,
    filter: VehicleFilter,
    limit?: number,
    offset?: number,
  ): Vehicle[] {
    if (!this.customers.findById(customerId)) {
      throw new NotFoundError('customer', customerId);
    }
    return this.repo.list(customerId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Vehicle {
    const vehicle = this.repo.findById(id);
    if (!vehicle) throw new NotFoundError('vehicle', id);
    return vehicle;
  }

  update(id: number, patch: VehiclePatch): Vehicle {
    const current = this.getById(id);
    if (
      patch.odometerMiles !== undefined &&
      patch.odometerMiles < current.odometerMiles
    ) {
      throw new ConflictError(
        `odometer cannot go backwards: ${current.odometerMiles} to ${patch.odometerMiles}`,
      );
    }
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('vehicle', id);
    return updated;
  }
}
