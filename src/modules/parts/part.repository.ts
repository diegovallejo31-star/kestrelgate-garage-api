import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { NewPart, Part, PartPatch, PartRow } from './part.types';

export function toPart(row: PartRow): Part {
  return {
    id: row.id,
    partNumber: row.part_number,
    description: row.description,
    tradePricePence: row.trade_price_pence,
    markupBasisPoints: row.markup_basis_points,
    onHand: row.on_hand,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface PartFilter {
  partNumber?: string;
}

export class PartRepository {
  constructor(private readonly db: Database) {}

  create(input: NewPart): Part {
    const row = this.db
      .prepare(
        `INSERT INTO parts (part_number, description, trade_price_pence, markup_basis_points, on_hand)
         VALUES (?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.partNumber,
        input.description,
        input.tradePricePence,
        input.markupBasisPoints,
        input.onHand,
      ) as unknown as PartRow;
    return toPart(row);
  }

  findById(id: number): Part | null {
    const row = this.db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as unknown as
      PartRow | undefined;
    return row ? toPart(row) : null;
  }

  findByPartNumber(partNumber: string): Part | null {
    const row = this.db
      .prepare('SELECT * FROM parts WHERE part_number = ?')
      .get(partNumber) as unknown as PartRow | undefined;
    return row ? toPart(row) : null;
  }

  list(page: Page, filter: PartFilter = {}): Part[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    if (filter.partNumber !== undefined) {
      clauses.push('part_number = ?');
      args.push(filter.partNumber);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(`SELECT * FROM parts ${where} ORDER BY part_number ASC LIMIT ? OFFSET ?`)
      .all(...args, page.limit, page.offset) as unknown as PartRow[];
    return rows.map(toPart);
  }

  update(id: number, patch: PartPatch): Part | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(
        `UPDATE parts SET trade_price_pence = ?, markup_basis_points = ?, on_hand = ?, ${TOUCHED} WHERE id = ? RETURNING *`,
      )
      .get(
        patch.tradePricePence ?? current.tradePricePence,
        patch.markupBasisPoints ?? current.markupBasisPoints,
        patch.onHand ?? current.onHand,
        id,
      ) as unknown as PartRow;
    return toPart(row);
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM parts').get() as unknown as {
      n: number;
    };
    return row.n;
  }
}
