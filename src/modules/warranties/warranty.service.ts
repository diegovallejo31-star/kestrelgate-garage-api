import { ConflictError, NotFoundError, ValidationError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { JobRepository } from '../jobs/job.repository';
import type { WarrantyFilter, WarrantyRepository } from './warranty.repository';
import type { Warranty, WarrantyDraft } from './warranty.types';

/**
 * Guarantees.
 *
 * A warranty has to cover something - a guarantee that covers neither parts nor
 * labour is not a guarantee, so both false is refused at creation. A claim only
 * stands while the warranty is active and on or before the day it expires; a
 * claim after that lapses it instead, and either way it does not go back to
 * active. The comeback that was booked against it is what the customer was told.
 */
export class WarrantyService {
  constructor(
    private readonly repo: WarrantyRepository,
    private readonly jobs: JobRepository,
  ) {}

  create(jobId: number, input: WarrantyDraft): Warranty {
    if (!this.jobs.findById(jobId)) {
      throw new NotFoundError('job', jobId);
    }
    if (!input.coversParts && !input.coversLabour) {
      throw new ValidationError('a warranty has to cover parts, labour, or both');
    }
    if (input.expiresOn <= input.givenOn) {
      throw new ValidationError(
        'a warranty cannot lapse on or before the day it is given',
      );
    }
    if (this.repo.findByReference(input.reference)) {
      throw new ConflictError(`warranty ${input.reference} already exists`);
    }
    return this.repo.create({ ...input, jobId });
  }

  list(
    jobId: number,
    filter: WarrantyFilter,
    limit?: number,
    offset?: number,
  ): Warranty[] {
    if (!this.jobs.findById(jobId)) {
      throw new NotFoundError('job', jobId);
    }
    return this.repo.list(jobId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Warranty {
    const warranty = this.repo.findById(id);
    if (!warranty) throw new NotFoundError('warranty', id);
    return warranty;
  }

  /** Records a claim, or lapses the guarantee if the claim came too late. */
  claim(id: number, claimedOn: string): Warranty {
    const warranty = this.getById(id);
    if (warranty.status !== 'active') {
      throw new ConflictError(
        `warranty ${id} is ${warranty.status} and cannot be claimed`,
      );
    }
    const next = claimedOn <= warranty.expiresOn ? 'claimed' : 'lapsed';
    const moved = this.repo.setStatus(id, next);
    if (!moved) throw new NotFoundError('warranty', id);
    return moved;
  }
}
