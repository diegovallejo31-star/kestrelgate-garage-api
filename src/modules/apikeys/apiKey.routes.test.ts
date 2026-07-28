import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app';
import { env } from '../../config/env';
import { createTestDb } from '../../../tests/testDb';

function buildApp(): Express {
  return createApp(createTestDb());
}

function withKey(app: Express, method: 'get' | 'post', url: string) {
  return request(app)[method](url).set('Authorization', `Bearer ${env.apiKey}`);
}

describe('api keys', () => {
  it('issues a key and answers the token exactly once', async () => {
    const app = buildApp();

    const issued = await withKey(app, 'post', '/api-keys').send({
      label: 'counter tablet',
    });
    expect(issued.status).toBe(201);
    expect(typeof issued.body.token).toBe('string');

    const listed = await withKey(app, 'get', '/api-keys');
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].token).toBeUndefined();
    expect(listed.body.items[0].label).toBe('counter tablet');
  });

  it('lets a caller in on a key it issued', async () => {
    const app = buildApp();
    const issued = await withKey(app, 'post', '/api-keys').send({ label: 'office desk' });

    const res = await request(app)
      .get('/api-keys')
      .set('Authorization', `Bearer ${issued.body.token}`);
    expect(res.status).toBe(200);
  });

  it('shuts a revoked key out', async () => {
    const app = buildApp();
    const issued = await withKey(app, 'post', '/api-keys').send({ label: 'lost tablet' });

    await withKey(app, 'post', `/api-keys/${issued.body.id}/revoke`);

    const res = await request(app)
      .get('/api-keys')
      .set('Authorization', `Bearer ${issued.body.token}`);
    expect(res.status).toBe(401);
  });

  it('will not revoke one key twice', async () => {
    const app = buildApp();
    const issued = await withKey(app, 'post', '/api-keys').send({ label: 'old tablet' });
    await withKey(app, 'post', `/api-keys/${issued.body.id}/revoke`);

    expect(
      (await withKey(app, 'post', `/api-keys/${issued.body.id}/revoke`)).status,
    ).toBe(409);
  });

  it('turns away a key nobody issued', async () => {
    const app = buildApp();

    expect(
      (await request(app).get('/api-keys').set('Authorization', 'Bearer nope')).status,
    ).toBe(401);
    expect((await withKey(app, 'post', '/api-keys/999999/revoke')).status).toBe(404);
  });
});
