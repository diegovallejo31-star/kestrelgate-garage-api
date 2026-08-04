import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type {
  Booking,
  BookingPatch,
  BookingRow,
  BookingStatus,
  NewBooking,
} from './booking.types';

export function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    siteId: row.site_id,
    bookedFor: row.booked_for,
    reason: row.reason,
    odometerIn: row.odometer_in,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface BookingFilter {
  status?: BookingStatus;
  siteId?: number;
}

export class BookingRepository {
  constructor(private readonly db: Database) {}

  create(input: NewBooking): Booking {
    const row = this.db
      .prepare(
        `INSERT INTO bookings (vehicle_id, site_id, booked_for, reason, odometer_in)
         VALUES (?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.vehicleId,
        input.siteId,
        input.bookedFor,
        input.reason,
        input.odometerIn ?? null,
      ) as unknown as BookingRow;
    return toBooking(row);
  }

  findById(id: number): Booking | null {
    const row = this.db
      .prepare('SELECT * FROM bookings WHERE id = ?')
      .get(id) as unknown as BookingRow | undefined;
    return row ? toBooking(row) : null;
  }

  list(vehicleId: number, page: Page, filter: BookingFilter = {}): Booking[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('vehicle_id = ?');
    args.push(vehicleId);
    if (filter.status) {
      clauses.push('status = ?');
      args.push(filter.status);
    }
    if (filter.siteId !== undefined) {
      clauses.push('site_id = ?');
      args.push(filter.siteId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM bookings ${where} ORDER BY booked_for ASC, id ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as BookingRow[];
    return rows.map(toBooking);
  }

  update(id: number, patch: BookingPatch): Booking | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(`UPDATE bookings SET odometer_in = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(patch.odometerIn ?? current.odometerIn ?? null, id) as unknown as BookingRow;
    return toBooking(row);
  }

  setStatus(id: number, next: BookingStatus): Booking | null {
    const row = this.db
      .prepare(`UPDATE bookings SET status = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(next, id) as unknown as BookingRow | undefined;
    return row ? toBooking(row) : null;
  }

  count(vehicleId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM bookings WHERE vehicle_id = ?')
      .get(vehicleId) as unknown as { n: number };
    return row.n;
  }
}
