import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { NewSite, Site, SitePatch, SiteRow } from './site.types';

export function toSite(row: SiteRow): Site {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    town: row.town,
    ramps: row.ramps,
    openedOn: row.opened_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface SiteFilter {
  code?: string;
}

export class SiteRepository {
  constructor(private readonly db: Database) {}

  create(input: NewSite): Site {
    const row = this.db
      .prepare(
        `INSERT INTO sites (code, name, town, ramps, opened_on)
         VALUES (?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.code,
        input.name,
        input.town,
        input.ramps,
        input.openedOn,
      ) as unknown as SiteRow;
    return toSite(row);
  }

  findById(id: number): Site | null {
    const row = this.db.prepare('SELECT * FROM sites WHERE id = ?').get(id) as unknown as
      SiteRow | undefined;
    return row ? toSite(row) : null;
  }

  findByCode(code: string): Site | null {
    const row = this.db
      .prepare('SELECT * FROM sites WHERE code = ?')
      .get(code) as unknown as SiteRow | undefined;
    return row ? toSite(row) : null;
  }

  list(page: Page, filter: SiteFilter = {}): Site[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    if (filter.code !== undefined) {
      clauses.push('code = ?');
      args.push(filter.code);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(`SELECT * FROM sites ${where} ORDER BY code ASC LIMIT ? OFFSET ?`)
      .all(...args, page.limit, page.offset) as unknown as SiteRow[];
    return rows.map(toSite);
  }

  update(id: number, patch: SitePatch): Site | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(`UPDATE sites SET ramps = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(patch.ramps ?? current.ramps, id) as unknown as SiteRow;
    return toSite(row);
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM sites').get() as unknown as {
      n: number;
    };
    return row.n;
  }
}
