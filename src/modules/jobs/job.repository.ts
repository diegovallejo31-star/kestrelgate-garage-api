import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { Job, JobRow, JobStatus, NewJob } from './job.types';

export function toJob(row: JobRow): Job {
  return {
    id: row.id,
    bookingId: row.booking_id,
    technicianId: row.technician_id,
    description: row.description,
    labourTenths: row.labour_tenths,
    labourPence: row.labour_pence,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface JobFilter {
  status?: JobStatus;
  technicianId?: number;
}

export class JobRepository {
  constructor(private readonly db: Database) {}

  create(input: NewJob): Job {
    const row = this.db
      .prepare(
        `INSERT INTO jobs (booking_id, technician_id, description, labour_tenths, labour_pence)
         VALUES (?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.bookingId,
        input.technicianId,
        input.description,
        input.labourTenths,
        input.labourPence,
      ) as unknown as JobRow;
    return toJob(row);
  }

  findById(id: number): Job | null {
    const row = this.db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as unknown as
      JobRow | undefined;
    return row ? toJob(row) : null;
  }

  list(bookingId: number, page: Page, filter: JobFilter = {}): Job[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('booking_id = ?');
    args.push(bookingId);
    if (filter.status) {
      clauses.push('status = ?');
      args.push(filter.status);
    }
    if (filter.technicianId !== undefined) {
      clauses.push('technician_id = ?');
      args.push(filter.technicianId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(`SELECT * FROM jobs ${where} ORDER BY id ASC LIMIT ? OFFSET ?`)
      .all(...args, page.limit, page.offset) as unknown as JobRow[];
    return rows.map(toJob);
  }

  setStatus(id: number, next: JobStatus): Job | null {
    const row = this.db
      .prepare(`UPDATE jobs SET status = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(next, id) as unknown as JobRow | undefined;
    return row ? toJob(row) : null;
  }

  count(bookingId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM jobs WHERE booking_id = ?')
      .get(bookingId) as unknown as { n: number };
    return row.n;
  }
}
