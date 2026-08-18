import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type {
  NewSupplierOrder,
  SupplierOrder,
  SupplierOrderRow,
  SupplierOrderStatus,
} from './supplierOrder.types';

export function toSupplierOrder(row: SupplierOrderRow): SupplierOrder {
  return {
    id: row.id,
    partId: row.part_id,
    reference: row.reference,
    orderedOn: row.ordered_on,
    quantity: row.quantity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface SupplierOrderFilter {
  status?: SupplierOrderStatus;
  reference?: string;
}

export class SupplierOrderRepository {
  constructor(private readonly db: Database) {}

  create(input: NewSupplierOrder): SupplierOrder {
    const row = this.db
      .prepare(
        `INSERT INTO supplier_orders (part_id, reference, ordered_on, quantity)
         VALUES (?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.partId,
        input.reference,
        input.orderedOn,
        input.quantity,
      ) as unknown as SupplierOrderRow;
    return toSupplierOrder(row);
  }

  findById(id: number): SupplierOrder | null {
    const row = this.db
      .prepare('SELECT * FROM supplier_orders WHERE id = ?')
      .get(id) as unknown as SupplierOrderRow | undefined;
    return row ? toSupplierOrder(row) : null;
  }

  findByReference(reference: string): SupplierOrder | null {
    const row = this.db
      .prepare('SELECT * FROM supplier_orders WHERE reference = ?')
      .get(reference) as unknown as SupplierOrderRow | undefined;
    return row ? toSupplierOrder(row) : null;
  }

  list(partId: number, page: Page, filter: SupplierOrderFilter = {}): SupplierOrder[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('part_id = ?');
    args.push(partId);
    if (filter.status) {
      clauses.push('status = ?');
      args.push(filter.status);
    }
    if (filter.reference !== undefined) {
      clauses.push('reference = ?');
      args.push(filter.reference);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM supplier_orders ${where} ORDER BY ordered_on DESC, id DESC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as SupplierOrderRow[];
    return rows.map(toSupplierOrder);
  }

  setStatus(id: number, next: SupplierOrderStatus): SupplierOrder | null {
    const row = this.db
      .prepare(
        `UPDATE supplier_orders SET status = ?, ${TOUCHED} WHERE id = ? RETURNING *`,
      )
      .get(next, id) as unknown as SupplierOrderRow | undefined;
    return row ? toSupplierOrder(row) : null;
  }

  count(partId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM supplier_orders WHERE part_id = ?')
      .get(partId) as unknown as { n: number };
    return row.n;
  }
}
