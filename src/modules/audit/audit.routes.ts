import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../db/client';
import { pageFrom } from '../../lib/pagination';
import { validateRequest } from '../../middleware/validateRequest';

interface AuditRow {
  id: number;
  method: string;
  path: string;
  status_code: number;
  actor: string | null;
  took_ms: number;
  created_at: string;
}

const querySchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']).optional(),
  minStatus: z.coerce.number().int().min(100).max(599).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Reads the audit trail back.
 *
 * Only readable: nothing writes here but the middleware, and an audit trail
 * anybody can amend is not one worth keeping.
 */
export function createAuditRouter(db: Database): Router {
  const router = Router();

  router.get('/', validateRequest({ query: querySchema }), (req, res) => {
    const { method, minStatus, limit, offset } = req.query as unknown as {
      method?: string;
      minStatus?: number;
      limit?: number;
      offset?: number;
    };
    const page = pageFrom(limit, offset);

    const clauses: string[] = [];
    const args: (string | number)[] = [];
    if (method) {
      clauses.push('method = ?');
      args.push(method);
    }
    if (minStatus !== undefined) {
      clauses.push('status_code >= ?');
      args.push(minStatus);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = db
      .prepare(`SELECT * FROM audit_entries ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .all(...args, page.limit, page.offset) as unknown as AuditRow[];

    res.json({
      items: rows.map((row) => ({
        id: row.id,
        method: row.method,
        path: row.path,
        statusCode: row.status_code,
        actor: row.actor,
        tookMs: row.took_ms,
        createdAt: row.created_at,
      })),
    });
  });

  return router;
}
