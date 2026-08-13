import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { NewPayment, Payment, PaymentRow } from './payment.types';

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    paidOn: row.paid_on,
    method: row.method,
    amountPence: row.amount_pence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PaymentFilter {
  invoiceId?: number;
  method?: 'card' | 'cash' | 'bank_transfer' | 'account';
}

export class PaymentRepository {
  constructor(private readonly db: Database) {}

  create(input: NewPayment): Payment {
    const row = this.db
      .prepare(
        `INSERT INTO payments (invoice_id, paid_on, method, amount_pence)
         VALUES (?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.invoiceId,
        input.paidOn,
        input.method,
        input.amountPence,
      ) as unknown as PaymentRow;
    return toPayment(row);
  }

  findById(id: number): Payment | null {
    const row = this.db
      .prepare('SELECT * FROM payments WHERE id = ?')
      .get(id) as unknown as PaymentRow | undefined;
    return row ? toPayment(row) : null;
  }

  list(page: Page, filter: PaymentFilter = {}): Payment[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    if (filter.invoiceId !== undefined) {
      clauses.push('invoice_id = ?');
      args.push(filter.invoiceId);
    }
    if (filter.method !== undefined) {
      clauses.push('method = ?');
      args.push(filter.method);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM payments ${where} ORDER BY paid_on ASC, id ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as PaymentRow[];
    return rows.map(toPayment);
  }

  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM payments')
      .get() as unknown as { n: number };
    return row.n;
  }

  /** Everything received against one invoice, oldest first. */
  forInvoice(invoiceId: number): Payment[] {
    const rows = this.db
      .prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_on ASC, id ASC')
      .all(invoiceId) as unknown as PaymentRow[];
    return rows.map(toPayment);
  }
}
