import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { MotTest, MotTestRow, NewMotTest } from './motTest.types';

export function toMotTest(row: MotTestRow): MotTest {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    certificateNumber: row.certificate_number,
    testedOn: row.tested_on,
    result: row.result,
    odometerMiles: row.odometer_miles,
    expiresOn: row.expires_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MotTestFilter {
  certificateNumber?: string;
}

export class MotTestRepository {
  constructor(private readonly db: Database) {}

  create(input: NewMotTest): MotTest {
    const row = this.db
      .prepare(
        `INSERT INTO mot_tests (vehicle_id, certificate_number, tested_on, result, odometer_miles, expires_on)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.vehicleId,
        input.certificateNumber,
        input.testedOn,
        input.result,
        input.odometerMiles,
        input.expiresOn ?? null,
      ) as unknown as MotTestRow;
    return toMotTest(row);
  }

  findById(id: number): MotTest | null {
    const row = this.db
      .prepare('SELECT * FROM mot_tests WHERE id = ?')
      .get(id) as unknown as MotTestRow | undefined;
    return row ? toMotTest(row) : null;
  }

  findByCertificateNumber(certificateNumber: string): MotTest | null {
    const row = this.db
      .prepare('SELECT * FROM mot_tests WHERE certificate_number = ?')
      .get(certificateNumber) as unknown as MotTestRow | undefined;
    return row ? toMotTest(row) : null;
  }

  list(vehicleId: number, page: Page, filter: MotTestFilter = {}): MotTest[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('vehicle_id = ?');
    args.push(vehicleId);
    if (filter.certificateNumber !== undefined) {
      clauses.push('certificate_number = ?');
      args.push(filter.certificateNumber);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM mot_tests ${where} ORDER BY tested_on DESC, id DESC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as MotTestRow[];
    return rows.map(toMotTest);
  }

  count(vehicleId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM mot_tests WHERE vehicle_id = ?')
      .get(vehicleId) as unknown as { n: number };
    return row.n;
  }
}
