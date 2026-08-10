import { ConflictError, NotFoundError, ValidationError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import type { MotTestFilter, MotTestRepository } from './motTest.repository';
import type { MotTest, MotTestDraft } from './motTest.types';

/**
 * MOT tests.
 *
 * Three things have to hold and none of them are the schema's business: a test
 * cannot predate the vehicle, a pass carries an expiry and a fail does not, and
 * a certificate number belongs to one test across the whole group. The last one
 * is what stops a retest being recorded against the wrong car.
 */
export class MotTestService {
  constructor(
    private readonly repo: MotTestRepository,
    private readonly vehicles: VehicleRepository,
  ) {}

  create(vehicleId: number, input: MotTestDraft): MotTest {
    const vehicle = this.vehicles.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('vehicle', vehicleId);

    if (input.testedOn < vehicle.firstRegisteredOn) {
      throw new ValidationError(
        `tested on ${input.testedOn}, before the vehicle was registered on ${vehicle.firstRegisteredOn}`,
      );
    }
    if (input.result === 'pass' && !input.expiresOn) {
      throw new ValidationError('a pass has to carry the date the certificate runs out');
    }
    if (input.result === 'fail' && input.expiresOn) {
      throw new ValidationError('a fail does not have an expiry date');
    }
    if (input.expiresOn && input.expiresOn <= input.testedOn) {
      throw new ValidationError(
        'a certificate cannot run out on or before the day of the test',
      );
    }
    if (this.repo.findByCertificateNumber(input.certificateNumber)) {
      throw new ConflictError(
        `certificate ${input.certificateNumber} is already recorded`,
      );
    }

    return this.repo.create({ ...input, vehicleId });
  }

  list(
    vehicleId: number,
    filter: MotTestFilter,
    limit?: number,
    offset?: number,
  ): MotTest[] {
    if (!this.vehicles.findById(vehicleId)) {
      throw new NotFoundError('vehicle', vehicleId);
    }
    return this.repo.list(vehicleId, pageFrom(limit, offset), filter);
  }

  getById(id: number): MotTest {
    const test = this.repo.findById(id);
    if (!test) throw new NotFoundError('mot test', id);
    return test;
  }
}
