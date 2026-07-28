import type { Database } from '../../db/client';
import { env } from '../../config/env';
import { ConflictError, UnauthorisedError } from '../../lib/AppError';
import { hashPassword, verifyPassword } from '../../lib/password';
import { newToken } from '../../lib/tokens';

export type Role = 'technician' | 'service_desk' | 'parts' | 'viewer';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface UserRow {
  id: number;
  email: string;
  full_name: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export class AuthService {
  constructor(private readonly db: Database) {}

  /**
   * Registers somebody who works here.
   *
   * The email is the handle, so two accounts may not share one. The password is
   * hashed on the way in and the hash never leaves this class.
   */
  register(email: string, fullName: string, password: string, role: Role): User {
    const taken = this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email.toLowerCase());
    if (taken) throw new ConflictError(`${email} is already registered`);

    const row = this.db
      .prepare(
        `INSERT INTO users (email, full_name, password_hash, role)
         VALUES (?, ?, ?, ?) RETURNING *`,
      )
      .get(
        email.toLowerCase(),
        fullName,
        hashPassword(password),
        role,
      ) as unknown as UserRow;
    return toUser(row);
  }

  /**
   * Signs somebody in.
   *
   * The same error is given whether the email is unknown or the password wrong:
   * telling the two apart is telling an attacker which half to keep guessing.
   */
  signIn(email: string, password: string): Session {
    const row = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as unknown as UserRow | undefined;
    if (!row || !verifyPassword(password, row.password_hash)) {
      throw new UnauthorisedError('That email and password do not go together');
    }

    const token = newToken();
    const expiresAt = new Date(
      Date.now() + env.sessionTtlHours * 3_600_000,
    ).toISOString();
    this.db
      .prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
      .run(row.id, token, expiresAt);

    return { token, expiresAt, user: toUser(row) };
  }

  /** Who a session belongs to, if it is still live. */
  whoIs(token: string): User {
    const row = this.db
      .prepare(
        `SELECT u.* FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > ?`,
      )
      .get(token, new Date().toISOString()) as unknown as UserRow | undefined;
    if (!row) throw new UnauthorisedError('That session has run out');
    return toUser(row);
  }

  /** Signs out, which is simply forgetting the session. */
  signOut(token: string): void {
    this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  /** Clears out sessions that have run out, for anything sweeping the table. */
  clearExpired(): number {
    const before = this.db
      .prepare('SELECT COUNT(*) as n FROM sessions')
      .get() as unknown as {
      n: number;
    };
    this.db
      .prepare('DELETE FROM sessions WHERE expires_at <= ?')
      .run(new Date().toISOString());
    const after = this.db
      .prepare('SELECT COUNT(*) as n FROM sessions')
      .get() as unknown as {
      n: number;
    };
    return before.n - after.n;
  }
}
