import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { Fitment, FitmentRow, NewFitment } from './fitment.types';

export function toFitment(row: FitmentRow): Fitment {
  return {
    id: row.id,
    jobId: row.job_id,
    partId: row.part_id,
    quantity: row.quantity,
    unitPricePence: row.unit_price_pence,
    linePence: row.line_pence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface FitmentFilter {
  partId?: number;
}

export class FitmentRepository {
  constructor(private readonly db: Database) {}

  create(input: NewFitment): Fitment {
    const row = this.db
      .prepare(
        `INSERT INTO fitments (job_id, part_id, quantity, unit_price_pence, line_pence)
         VALUES (?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.jobId,
        input.partId,
        input.quantity,
        input.unitPricePence,
        input.linePence,
      ) as unknown as FitmentRow;
    return toFitment(row);
  }

  findById(id: number): Fitment | null {
    const row = this.db
      .prepare('SELECT * FROM fitments WHERE id = ?')
      .get(id) as unknown as FitmentRow | undefined;
    return row ? toFitment(row) : null;
  }

  list(jobId: number, page: Page, filter: FitmentFilter = {}): Fitment[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('job_id = ?');
    args.push(jobId);
    if (filter.partId !== undefined) {
      clauses.push('part_id = ?');
      args.push(filter.partId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(`SELECT * FROM fitments ${where} ORDER BY id ASC LIMIT ? OFFSET ?`)
      .all(...args, page.limit, page.offset) as unknown as FitmentRow[];
    return rows.map(toFitment);
  }

  count(jobId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM fitments WHERE job_id = ?')
      .get(jobId) as unknown as { n: number };
    return row.n;
  }
}
