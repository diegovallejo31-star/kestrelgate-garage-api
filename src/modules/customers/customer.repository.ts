import type { Database } from '../../db/client';
import type { Page } from '../../lib/pagination';
import type { Customer, CustomerPatch, CustomerRow, NewCustomer } from './customer.types';

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    accountRef: row.account_ref,
    name: row.name,
    phone: row.phone,
    email: row.email,
    openedOn: row.opened_on,
    onAccount: row.on_account === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TOUCHED = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export interface CustomerFilter {
  accountRef?: string;
  onAccount?: boolean;
}

export class CustomerRepository {
  constructor(private readonly db: Database) {}

  create(input: NewCustomer): Customer {
    const row = this.db
      .prepare(
        `INSERT INTO customers (account_ref, name, phone, email, opened_on, on_account)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.accountRef,
        input.name,
        input.phone,
        input.email ?? null,
        input.openedOn,
        (input.onAccount ?? false) ? 1 : 0,
      ) as unknown as CustomerRow;
    return toCustomer(row);
  }

  findById(id: number): Customer | null {
    const row = this.db
      .prepare('SELECT * FROM customers WHERE id = ?')
      .get(id) as unknown as CustomerRow | undefined;
    return row ? toCustomer(row) : null;
  }

  findByAccountRef(accountRef: string): Customer | null {
    const row = this.db
      .prepare('SELECT * FROM customers WHERE account_ref = ?')
      .get(accountRef) as unknown as CustomerRow | undefined;
    return row ? toCustomer(row) : null;
  }

  list(page: Page, filter: CustomerFilter = {}): Customer[] {
    const clauses: string[] = [];
    const args: (string | number)[] = [];
    if (filter.accountRef !== undefined) {
      clauses.push('account_ref = ?');
      args.push(filter.accountRef);
    }
    if (filter.onAccount !== undefined) {
      clauses.push('on_account = ?');
      args.push(filter.onAccount ? 1 : 0);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(
        `SELECT * FROM customers ${where} ORDER BY account_ref ASC LIMIT ? OFFSET ?`,
      )
      .all(...args, page.limit, page.offset) as unknown as CustomerRow[];
    return rows.map(toCustomer);
  }

  update(id: number, patch: CustomerPatch): Customer | null {
    const current = this.findById(id);
    if (!current) return null;

    const row = this.db
      .prepare(
        `UPDATE customers SET email = ?, on_account = ?, ${TOUCHED} WHERE id = ? RETURNING *`,
      )
      .get(
        patch.email ?? current.email ?? null,
        (patch.onAccount ?? current.onAccount) ? 1 : 0,
        id,
      ) as unknown as CustomerRow;
    return toCustomer(row);
  }

  count(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS n FROM customers')
      .get() as unknown as { n: number };
    return row.n;
  }
}
