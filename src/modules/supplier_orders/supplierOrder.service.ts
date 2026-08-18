import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { PartRepository } from '../parts/part.repository';
import type {
  SupplierOrderFilter,
  SupplierOrderRepository,
} from './supplierOrder.repository';
import type {
  SupplierOrder,
  SupplierOrderDraft,
  SupplierOrderStatus,
} from './supplierOrder.types';

/**
 * Restock orders.
 *
 * An order leaves the ordered state exactly once. Receiving it is the single
 * place stock goes up - there is no way to adjust a part's on-hand count
 * directly - so a shelf that is wrong is an order that was received without the
 * stock arriving, which is a thing somebody can go and look for. Cancelling
 * touches no stock at all.
 */
export class SupplierOrderService {
  constructor(
    private readonly repo: SupplierOrderRepository,
    private readonly parts: PartRepository,
  ) {}

  create(partId: number, input: SupplierOrderDraft): SupplierOrder {
    if (!this.parts.findById(partId)) {
      throw new NotFoundError('part', partId);
    }
    if (this.repo.findByReference(input.reference)) {
      throw new ConflictError(`order ${input.reference} already exists`);
    }
    return this.repo.create({ ...input, partId });
  }

  list(
    partId: number,
    filter: SupplierOrderFilter,
    limit?: number,
    offset?: number,
  ): SupplierOrder[] {
    if (!this.parts.findById(partId)) {
      throw new NotFoundError('part', partId);
    }
    return this.repo.list(partId, pageFrom(limit, offset), filter);
  }

  getById(id: number): SupplierOrder {
    const order = this.repo.findById(id);
    if (!order) throw new NotFoundError('supplier order', id);
    return order;
  }

  changeStatus(id: number, next: Exclude<SupplierOrderStatus, 'ordered'>): SupplierOrder {
    const order = this.getById(id);
    if (order.status !== 'ordered') {
      throw new ConflictError(
        `order ${id} is already ${order.status} and cannot change again`,
      );
    }

    if (next === 'received') {
      const part = this.parts.findById(order.partId);
      if (!part) throw new NotFoundError('part', order.partId);
      this.parts.update(order.partId, { onHand: part.onHand + order.quantity });
    }

    const moved = this.repo.setStatus(id, next);
    if (!moved) throw new NotFoundError('supplier order', id);
    return moved;
  }
}
