import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { JobRepository } from '../jobs/job.repository';
import { PartRepository } from '../parts/part.repository';
import { PartService } from '../parts/part.service';
import type { FitmentFilter, FitmentRepository } from './fitment.repository';
import type { Fitment, FitmentDraft } from './fitment.types';

/**
 * Parts on a job.
 *
 * Fitting a part does two things that have to agree: it prices a line on the
 * invoice, and it takes the part off the shelf. The stock check happens before
 * either, so a van that has run out does not leave a priced line behind it.
 */
export class FitmentService {
  constructor(
    private readonly repo: FitmentRepository,
    private readonly jobs: JobRepository,
    private readonly parts: PartRepository,
  ) {}

  create(jobId: number, input: FitmentDraft): Fitment {
    const job = this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('job', jobId);
    if (job.status === 'done') {
      throw new ConflictError(
        `job ${jobId} has been signed off; nothing more goes on it`,
      );
    }

    const part = this.parts.findById(input.partId);
    if (!part) throw new NotFoundError('part', input.partId);
    if (part.onHand < input.quantity) {
      throw new ConflictError(
        `only ${part.onHand} of ${part.partNumber} on hand, ${input.quantity} wanted`,
      );
    }

    const unitPricePence = PartService.retailPence(part);
    const fitment = this.repo.create({
      ...input,
      jobId,
      unitPricePence,
      linePence: unitPricePence * input.quantity,
    });
    this.parts.update(input.partId, { onHand: part.onHand - input.quantity });
    return fitment;
  }

  list(jobId: number, filter: FitmentFilter, limit?: number, offset?: number): Fitment[] {
    if (!this.jobs.findById(jobId)) {
      throw new NotFoundError('job', jobId);
    }
    return this.repo.list(jobId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Fitment {
    const fitment = this.repo.findById(id);
    if (!fitment) throw new NotFoundError('fitment', id);
    return fitment;
  }

  /** What the parts on one job come to. */
  partsTotal(jobId: number): number {
    return this.repo
      .list(jobId, { limit: 1000, offset: 0 }, {})
      .reduce((total, fitment) => total + fitment.linePence, 0);
  }
}
