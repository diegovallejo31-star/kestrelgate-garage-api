import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { SiteRepository } from '../sites/site.repository';
import type { CourtesyCarFilter, CourtesyCarRepository } from './courtesyCar.repository';
import type {
  CourtesyCar,
  CourtesyCarPatch,
  CourtesyCarStatus,
  NewCourtesyCar,
} from './courtesyCar.types';

const NEXT: Record<CourtesyCarStatus, CourtesyCarStatus[]> = {
  available: ['on_loan', 'off_road'],
  on_loan: ['available'],
  off_road: ['available'],
};

/**
 * Courtesy cars.
 *
 * A car only goes out from available, and only ever comes back to available -
 * you cannot send a car that is out on loan straight to off_road, because it is
 * not here to put on the ramp. The desk works off the available list, so a car
 * that is out has to be off it until it is physically back.
 */
export class CourtesyCarService {
  constructor(
    private readonly repo: CourtesyCarRepository,
    private readonly sites: SiteRepository,
  ) {}

  create(siteId: number, input: Omit<NewCourtesyCar, 'siteId'>): CourtesyCar {
    if (!this.sites.findById(siteId)) {
      throw new NotFoundError('site', siteId);
    }
    if (this.repo.findByRegistration(input.registration)) {
      throw new ConflictError(`${input.registration} is already a courtesy car`);
    }
    return this.repo.create({ ...input, siteId });
  }

  list(
    siteId: number,
    filter: CourtesyCarFilter,
    limit?: number,
    offset?: number,
  ): CourtesyCar[] {
    if (!this.sites.findById(siteId)) {
      throw new NotFoundError('site', siteId);
    }
    return this.repo.list(siteId, pageFrom(limit, offset), filter);
  }

  getById(id: number): CourtesyCar {
    const car = this.repo.findById(id);
    if (!car) throw new NotFoundError('courtesy car', id);
    return car;
  }

  update(id: number, patch: CourtesyCarPatch): CourtesyCar {
    this.getById(id);
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('courtesy car', id);
    return updated;
  }

  changeStatus(id: number, next: CourtesyCarStatus): CourtesyCar {
    const car = this.getById(id);
    if (car.status !== next && !NEXT[car.status].includes(next)) {
      throw new ConflictError(`a courtesy car cannot go from ${car.status} to ${next}`);
    }
    const moved = this.repo.setStatus(id, next);
    if (!moved) throw new NotFoundError('courtesy car', id);
    return moved;
  }
}
