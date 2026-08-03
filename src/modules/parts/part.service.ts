import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { bpsOf } from '../../lib/money';
import type { PartFilter, PartRepository } from './part.repository';
import type { NewPart, Part, PartPatch } from './part.types';

/**
 * The catalogue.
 *
 * `retailPence` is deliberately a function rather than a column: two jobs a
 * month apart should be priced at whatever the markup was on the day, and the
 * only way to keep that honest is to make the caller ask for it explicitly.
 */
export class PartService {
  constructor(private readonly repo: PartRepository) {}

  static retailPence(part: Part): number {
    return part.tradePricePence + bpsOf(part.tradePricePence, part.markupBasisPoints);
  }

  create(input: NewPart): Part {
    if (this.repo.findByPartNumber(input.partNumber)) {
      throw new ConflictError(`part ${input.partNumber} is already in the catalogue`);
    }
    return this.repo.create(input);
  }

  list(filter: PartFilter, limit?: number, offset?: number): Part[] {
    return this.repo.list(pageFrom(limit, offset), filter);
  }

  getById(id: number): Part {
    const part = this.repo.findById(id);
    if (!part) throw new NotFoundError('part', id);
    return part;
  }

  update(id: number, patch: PartPatch): Part {
    this.getById(id);
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('part', id);
    return updated;
  }

  /** Takes stock off the shelf, refusing to go below zero. */
  draw(id: number, quantity: number): Part {
    const part = this.getById(id);
    if (part.onHand < quantity) {
      throw new ConflictError(
        `only ${part.onHand} of ${part.partNumber} on hand, ${quantity} wanted`,
      );
    }
    const updated = this.repo.update(id, { onHand: part.onHand - quantity });
    if (!updated) throw new NotFoundError('part', id);
    return updated;
  }
}
