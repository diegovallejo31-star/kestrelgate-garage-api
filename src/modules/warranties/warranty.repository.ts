import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type {
  NewWarranty,
  Warranty,
  WarrantyRow,
  WarrantyStatus,
} from './warranty.types';

export function toWarranty(row: WarrantyRow): Warranty {
  return {
    id: row.id,
    jobId: row.job_id,
    reference: row.reference,
    givenOn: row.given_on,
    expiresOn: row.expires_on,
    coversParts: row.covers_parts === 1,
    coversLabour: row.covers_labour === 1,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface WarrantyFilter {
  status?: WarrantyStatus;
  reference?: string;
}

export class WarrantyRepository {
  constructor(private readonly db: Database) {}

  create(input: NewWarranty): Warranty {
    const row = this.db
      .prepare(
        `INSERT INTO warranties (job_id, reference, given_on, expires_on, covers_parts, covers_labour)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.jobId,
        input.reference,
        input.givenOn,
        input.expiresOn,
        input.coversParts ? 1 : 0,
        input.coversLabour ? 1 : 0,
      ) as unknown as WarrantyRow;
    return toWarranty(row);
  }

  findById(id: number): Warranty | null {
    const row = this.db
      .prepare('SELECT * FROM warranties WHERE id = ?')
      .get(id) as unknown as WarrantyRow | undefined;
    return row ? toWarranty(row) : null;
  }

  findByReference(reference: string): Warranty | null {
    const row = this.db
      .prepare('SELECT * FROM warranties WHERE reference = ?')
      .get(reference) as unknown as WarrantyRow | undefined;
    return row ? toWarranty(row) : null;
  }

  list(jobId: number, page: Page, filter: WarrantyFilter = {}): Warranty[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('job_id = ?');
    args.push(jobId);
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
        `SELECT * FROM warranties ${where} ORDER BY given_on DESC, id DESC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as WarrantyRow[];
    return rows.map(toWarranty);
  }

  setStatus(id: number, next: WarrantyStatus): Warranty | null {
    const row = this.db
      .prepare(`UPDATE warranties SET status = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(next, id) as unknown as WarrantyRow | undefined;
    return row ? toWarranty(row) : null;
  }

  count(jobId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM warranties WHERE job_id = ?')
      .get(jobId) as unknown as { n: number };
    return row.n;
  }
}
