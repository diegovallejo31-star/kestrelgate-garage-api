import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type {
  NewReminder,
  Reminder,
  ReminderRow,
  ReminderStatus,
} from './reminder.types';

export function toReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    kind: row.kind,
    dueOn: row.due_on,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface ReminderFilter {
  status?: ReminderStatus;
  kind?: 'mot_due' | 'service_due' | 'recall';
}

export class ReminderRepository {
  constructor(private readonly db: Database) {}

  create(input: NewReminder): Reminder {
    const row = this.db
      .prepare(
        `INSERT INTO reminders (vehicle_id, kind, due_on, note)
         VALUES (?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.vehicleId,
        input.kind,
        input.dueOn,
        input.note,
      ) as unknown as ReminderRow;
    return toReminder(row);
  }

  findById(id: number): Reminder | null {
    const row = this.db
      .prepare('SELECT * FROM reminders WHERE id = ?')
      .get(id) as unknown as ReminderRow | undefined;
    return row ? toReminder(row) : null;
  }

  list(vehicleId: number, page: Page, filter: ReminderFilter = {}): Reminder[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    clauses.push('vehicle_id = ?');
    args.push(vehicleId);
    if (filter.status) {
      clauses.push('status = ?');
      args.push(filter.status);
    }
    if (filter.kind !== undefined) {
      clauses.push('kind = ?');
      args.push(filter.kind);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM reminders ${where} ORDER BY due_on ASC, id ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as ReminderRow[];
    return rows.map(toReminder);
  }

  setStatus(id: number, next: ReminderStatus): Reminder | null {
    const row = this.db
      .prepare(`UPDATE reminders SET status = ?, ${TOUCHED} WHERE id = ? RETURNING *`)
      .get(next, id) as unknown as ReminderRow | undefined;
    return row ? toReminder(row) : null;
  }

  count(vehicleId: number): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM reminders WHERE vehicle_id = ?')
      .get(vehicleId) as unknown as { n: number };
    return row.n;
  }
}
