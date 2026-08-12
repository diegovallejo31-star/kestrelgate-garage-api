import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { Invoice, InvoiceRow, NewInvoice } from './invoice.types';

export function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    bookingId: row.booking_id,
    number: row.number,
    raisedOn: row.raised_on,
    labourPence: row.labour_pence,
    partsPence: row.parts_pence,
    netPence: row.net_pence,
    vatPence: row.vat_pence,
    grossPence: row.gross_pence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface InvoiceFilter {
  bookingId?: number;
  number?: string;
}

export class InvoiceRepository {
  constructor(private readonly db: Database) {}

  create(input: NewInvoice): Invoice {
    const row = this.db
      .prepare(
        `INSERT INTO invoices (booking_id, number, raised_on, labour_pence, parts_pence, net_pence, vat_pence, gross_pence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.bookingId,
        input.number,
        input.raisedOn,
        input.labourPence,
        input.partsPence,
        input.netPence,
        input.vatPence,
        input.grossPence,
      ) as unknown as InvoiceRow;
    return toInvoice(row);
  }

  findById(id: number): Invoice | null {
    const row = this.db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .get(id) as unknown as InvoiceRow | undefined;
    return row ? toInvoice(row) : null;
  }

  findByNumber(number: string): Invoice | null {
    const row = this.db
      .prepare('SELECT * FROM invoices WHERE number = ?')
      .get(number) as unknown as InvoiceRow | undefined;
    return row ? toInvoice(row) : null;
  }

  list(page: Page, filter: InvoiceFilter = {}): Invoice[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    if (filter.bookingId !== undefined) {
      clauses.push('booking_id = ?');
      args.push(filter.bookingId);
    }
    if (filter.number !== undefined) {
      clauses.push('number = ?');
      args.push(filter.number);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM invoices ${where} ORDER BY raised_on DESC, id DESC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as InvoiceRow[];
    return rows.map(toInvoice);
  }

  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM invoices')
      .get() as unknown as { n: number };
    return row.n;
  }

  /**
   * The invoice raised against one booking, if there is one.
   *
   * Separate from the generated lookups because it keys on a number rather than
   * on something the customer typed.
   */
  findByBookingId(bookingId: number): Invoice | null {
    const row = this.db
      .prepare('SELECT * FROM invoices WHERE booking_id = ?')
      .get(bookingId) as unknown as InvoiceRow | undefined;
    return row ? toInvoice(row) : null;
  }
}
