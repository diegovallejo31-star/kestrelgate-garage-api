import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { createApp } from '../src/app';
import { errorHandler } from '../src/middleware/errorHandler';
import { validateRequest } from '../src/middleware/validateRequest';
import { createTestDb } from './testDb';

describe('request validation', () => {
  function appWithSchema() {
    const app = express();
    app.use(express.json());
    app.post(
      '/echo',
      validateRequest({ body: z.object({ name: z.string().min(2) }).strict() }),
      (req, res) => {
        res.json(req.body);
      }
    );
    app.use(errorHandler);
    return app;
  }

  it('passes a body that matches', async () => {
    const res = await request(appWithSchema()).post('/echo').send({ name: 'Anything' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Anything');
  });

  it('turns down a body that does not', async () => {
    const res = await request(appWithSchema()).post('/echo').send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('turns down a field nobody asked for', async () => {
    const res = await request(appWithSchema()).post('/echo').send({ name: 'Anything', spare: 1 });
    expect(res.status).toBe(400);
  });
});

describe('the error handler', () => {
  it('turns unparseable JSON into a validation error', async () => {
    const app = createApp(createTestDb());

    const res = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{ not json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });
});
