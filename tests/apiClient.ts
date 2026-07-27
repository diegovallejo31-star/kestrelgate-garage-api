import type { Express } from 'express';
import request from 'supertest';
import type { Test } from 'supertest';
import { env } from '../src/config/env';

/**
 * A supertest wrapper that carries the development API key.
 *
 * Every route outside /health and /auth wants a key, and a test that forgets
 * one fails with a 401 that says nothing about the rule it meant to check.
 */
export function api(app: Express) {
  const keyed = (test: Test): Test => test.set('Authorization', `Bearer ${env.apiKey}`);
  return {
    get: (url: string) => keyed(request(app).get(url)),
    post: (url: string) => keyed(request(app).post(url)),
    patch: (url: string) => keyed(request(app).patch(url)),
    delete: (url: string) => keyed(request(app).delete(url)),
  };
}
