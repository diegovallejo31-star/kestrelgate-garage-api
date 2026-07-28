import type { Database } from '../../db/client';
import { ConflictError, NotFoundError } from '../../lib/AppError';
import { hashToken, newToken } from '../../lib/tokens';

export interface ApiKey {
  id: number;
  label: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface ApiKeyRow {
  id: number;
  label: string;
  token_hash: string;
  revoked_at: string | null;
  created_at: string;
}

/** A key as it is answered once, at the moment it is issued. */
export interface IssuedApiKey extends ApiKey {
  token: string;
}

function toKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    label: row.label,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export class ApiKeyService {
  constructor(private readonly db: Database) {}

  /**
   * Issues a key.
   *
   * The token itself is answered once and never again: only its hash is kept,
   * so a leak of the table is not a leak of the keys. A label is required
   * because a key nobody can identify is a key nobody dares revoke.
   */
  issue(label: string): IssuedApiKey {
    const token = newToken();
    const row = this.db
      .prepare('INSERT INTO api_keys (label, token_hash) VALUES (?, ?) RETURNING *')
      .get(label, hashToken(token)) as unknown as ApiKeyRow;
    return { ...toKey(row), token };
  }

  list(): ApiKey[] {
    const rows = this.db
      .prepare('SELECT * FROM api_keys ORDER BY id DESC')
      .all() as unknown as ApiKeyRow[];
    return rows.map(toKey);
  }

  /** Revokes a key. Revoking one twice is a conflict, not a no-op. */
  revoke(id: number, at: string): ApiKey {
    const row = this.db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as unknown as
      | ApiKeyRow
      | undefined;
    if (!row) throw new NotFoundError('ApiKey', id);
    if (row.revoked_at) throw new ConflictError(`That key was revoked on ${row.revoked_at}`);

    const updated = this.db
      .prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ? RETURNING *')
      .get(at, id) as unknown as ApiKeyRow;
    return toKey(updated);
  }
}
