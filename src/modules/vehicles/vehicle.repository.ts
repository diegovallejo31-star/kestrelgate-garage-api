import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { NewVehicle, Vehicle, VehiclePatch, VehicleRow } from './vehicle.types';

export function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    customerId: row.customer_id,
    registration: row.registration,
    make: row.make,
    model: row.model,
    fuel: row.fuel,
    engineCc: row.engine_cc,
    firstRegisteredOn: row.first_registered_on,
    odometerMiles: row.odometer_miles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface VehicleFilter {
  registration?: string;
}

export class VehicleRepository {
  constructor(private readonly db: Database) {}

  create(input: NewVehicle): Vehicle {
    const row = this.db
      .prepare(
        `INSERT INTO vehicles (customer_id, registration, make, model, fuel, engine_cc, first_registered_on, odometer_miles)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.customerId,
        input.registration,
        input.make,
        input.model,
        input.fuel,
        input.engineCc,
        input.firstRegisteredOn,
        input.odometerMiles,
      ) as unknown as VehicleRow;
    return toVehicle(row);
  }

  findById(id: number): Vehicle | null {
    const row = this.db
      .prepare('SELECT * FROM vehicles WHERE id = ?')
      .get(id) as unknown as VehicleRow | undefined;
    return row ? toVehicle(row) : null;
  }

  findByRegistration(registration: string): Vehicle | null {
    const row = this.db
      .prepare('SELECT * FROM vehicles WHERE registration = ?')
      .get(registration) as unknown as VehicleRow | undefined;
    return row ? toVehicle(row) : null;
  }

  list(customerId: number, page: Page, filter: VehicleFilter = {}): Vehicle[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('customer_id = ?');
    args.push(customerId);
    if (filter.registration !== undefined) {
      clauses.push('registration = ?');
      args.push(filter.registration);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM vehicles ${where} ORDER BY registration ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as VehicleRow[];
    return rows.map(toVehicle);
  }

  update(id: number, patch: VehiclePatch): Vehicle | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(
        `UPDATE vehicles SET odometer_miles = ?, ${TOUCHED} WHERE id = ? RETURNING *`,
      )
      .get(patch.odometerMiles ?? current.odometerMiles, id) as unknown as VehicleRow;
    return toVehicle(row);
  }

  count(customerId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM vehicles WHERE customer_id = ?')
      .get(customerId) as unknown as { n: number };
    return row.n;
  }
}
