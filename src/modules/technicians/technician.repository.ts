import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type {
  NewTechnician,
  Technician,
  TechnicianPatch,
  TechnicianRow,
} from './technician.types';

export function toTechnician(row: TechnicianRow): Technician {
  return {
    id: row.id,
    siteId: row.site_id,
    clockNumber: row.clock_number,
    name: row.name,
    grade: row.grade,
    labourRatePence: row.labour_rate_pence,
    startedOn: row.started_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface TechnicianFilter {
  clockNumber?: string;
}

export class TechnicianRepository {
  constructor(private readonly db: Database) {}

  create(input: NewTechnician): Technician {
    const row = this.db
      .prepare(
        `INSERT INTO technicians (site_id, clock_number, name, grade, labour_rate_pence, started_on)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.siteId,
        input.clockNumber,
        input.name,
        input.grade,
        input.labourRatePence,
        input.startedOn,
      ) as unknown as TechnicianRow;
    return toTechnician(row);
  }

  findById(id: number): Technician | null {
    const row = this.db
      .prepare('SELECT * FROM technicians WHERE id = ?')
      .get(id) as unknown as TechnicianRow | undefined;
    return row ? toTechnician(row) : null;
  }

  findByClockNumber(siteId: number, clockNumber: string): Technician | null {
    const row = this.db
      .prepare('SELECT * FROM technicians WHERE site_id = ? AND clock_number = ?')
      .get(siteId, clockNumber) as unknown as TechnicianRow | undefined;
    return row ? toTechnician(row) : null;
  }

  list(siteId: number, page: Page, filter: TechnicianFilter = {}): Technician[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('site_id = ?');
    args.push(siteId);
    if (filter.clockNumber !== undefined) {
      clauses.push('clock_number = ?');
      args.push(filter.clockNumber);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM technicians ${where} ORDER BY clock_number ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as TechnicianRow[];
    return rows.map(toTechnician);
  }

  update(id: number, patch: TechnicianPatch): Technician | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(
        `UPDATE technicians SET grade = ?, labour_rate_pence = ?, ${TOUCHED} WHERE id = ? RETURNING *`,
      )
      .get(
        patch.grade ?? current.grade,
        patch.labourRatePence ?? current.labourRatePence,
        id,
      ) as unknown as TechnicianRow;
    return toTechnician(row);
  }

  count(siteId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM technicians WHERE site_id = ?')
      .get(siteId) as unknown as { n: number };
    return row.n;
  }
}
