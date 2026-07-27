import request from 'supertest';
import { createApp } from '../src/app';
import { createTestDb } from './testDb';

describe('the service itself', () => {
  it('answers a health check', async () => {
    const app = createApp(createTestDb());

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('answers a route nobody wrote with 404 and a reason', async () => {
    const app = createApp(createTestDb());

    const res = await request(app).get('/nowhere');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
});
