import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type {
  CourtesyCar,
  CourtesyCarPatch,
  CourtesyCarRow,
  CourtesyCarStatus,
  NewCourtesyCar,
} from './courtesyCar.types';

export function toCourtesyCar(row: CourtesyCarRow): CourtesyCar {
  return {
    id: row.id,
    siteId: row.site_id,
    registration: row.registration,
    model: row.model,
    seats: row.seats,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface CourtesyCarFilter {
  status?: CourtesyCarStatus;
  registration?: string;
}

export class CourtesyCarRepository {
  constructor(private readonly db: Database) {}

  create(input: NewCourtesyCar): CourtesyCar {
    const row = this.db
      .prepare(
        `INSERT INTO courtesy_cars (site_id, registration, model, seats)
         VALUES (?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.siteId,
        input.registration,
        input.model,
        input.seats,
      ) as unknown as CourtesyCarRow;
    return toCourtesyCar(row);
  }

  findById(id: number): CourtesyCar | null {
    const row = this.db
      .prepare('SELECT * FROM courtesy_cars WHERE id = ?')
      .get(id) as unknown as CourtesyCarRow | undefined;
    return row ? toCourtesyCar(row) : null;
  }

  findByRegistration(registration: string): CourtesyCar | null {
    const row = this.db
      .prepare('SELECT * FROM courtesy_cars WHERE registration = ?')
      .get(registration) as unknown as CourtesyCarRow | undefined;
    return row ? toCourtesyCar(row) : null;
  }

  list(siteId: number, page: Page, filter: CourtesyCarFilter = {}): CourtesyCar[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('site_id = ?');
    args.push(siteId);
    if (filter.status) {
      clauses.push('status = ?');
      args.push(filter.status);
    }
    if (filter.registration !== undefined) {
      clauses.push('registration = ?');
      args.push(filter.registration);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM courtesy_cars ${where} ORDER BY registration ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as CourtesyCarRow[];
    return rows.map(toCourtesyCar);
  }

  update(id: number, patch: CourtesyCarPatch): CourtesyCar | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(`UPDATE courtesy_cars SET seats = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(patch.seats ?? current.seats, id) as unknown as CourtesyCarRow;
    return toCourtesyCar(row);
  }

  setStatus(id: number, next: CourtesyCarStatus): CourtesyCar | null {
    const row = this.db
      .prepare(`UPDATE courtesy_cars SET status = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(next, id) as unknown as CourtesyCarRow | undefined;
    return row ? toCourtesyCar(row) : null;
  }

  count(siteId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM courtesy_cars WHERE site_id = ?')
      .get(siteId) as unknown as { n: number };
    return row.n;
  }
}
