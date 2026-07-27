export interface Page {
  limit: number;
  offset: number;
}

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

/** Clamps a caller's paging to something the database can answer quickly. */
export function pageFrom(limit?: number, offset?: number): Page {
  return {
    limit: Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
    offset: Math.max(offset ?? 0, 0),
  };
}
