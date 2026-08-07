import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeFitment, makeJob, makePart } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('fitments over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, { onHand: 50 });

    const made = await api(app)
      .post(`/jobs/${jobId}/fitments`)
      .send({ partId: partId, quantity: 2 });
    expect(made.status).toBe(201);

    const listed = await api(app).get(`/jobs/${jobId}/fitments`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, { onHand: 50 });

    const made = await api(app)
      .post(`/jobs/${jobId}/fitments`)
      .send({ partId: partId, quantity: 2 });
    expect(Object.keys(made.body).sort()).toEqual([
      'createdAt',
      'id',
      'jobId',
      'linePence',
      'partId',
      'quantity',
      'unitPricePence',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, { onHand: 50 });

    const made = await api(app)
      .post(`/jobs/${jobId}/fitments`)
      .send({ partId: partId, quantity: 2 });
    const read = await api(app).get(`/fitments/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/fitments/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, { onHand: 50 });

    const res = await api(app)
      .post(`/jobs/${jobId}/fitments`)
      .send({ partId: partId, quantity: 2, nonesuch: 1 });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const res = await api(app).get(`/jobs/${jobId}/fitments?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('404s when the job is not there', async () => {
    const app = buildApp();
    const partId = await makePart(app, { onHand: 50 });

    const res = await api(app)
      .post('/jobs/999999/fitments')
      .send({ partId: partId, quantity: 2 });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    await makeFitment(app, { jobId });
    await makeFitment(app, { jobId });

    const all = await api(app).get(`/jobs/${jobId}/fitments`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/jobs/${jobId}/fitments?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/fitments/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const res = await api(app).get(`/jobs/${jobId}/fitments?limit=0`);
    expect(res.status).toBe(400);
  });

  it('prices a line at the catalogue markup and holds it', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, {
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 10,
    });

    const made = await api(app)
      .post(`/jobs/${jobId}/fitments`)
      .send({ partId, quantity: 2 });
    expect(made.status).toBe(201);
    expect(made.body.unitPricePence).toBe(3550);
    expect(made.body.linePence).toBe(7100);

    const repriced = await api(app)
      .patch(`/parts/${partId}`)
      .send({ markupBasisPoints: 9000 });
    expect(repriced.status).toBe(200);

    const held = await api(app).get(`/fitments/${made.body.id}`);
    expect(held.body.unitPricePence).toBe(3550);
  });

  it('takes the parts off the shelf', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, { onHand: 10 });

    await api(app).post(`/jobs/${jobId}/fitments`).send({ partId, quantity: 4 });

    const part = await api(app).get(`/parts/${partId}`);
    expect(part.body.onHand).toBe(6);
  });

  it('refuses to fit more than are on the shelf, and leaves the stock alone', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    const partId = await makePart(app, { onHand: 3 });

    const res = await api(app)
      .post(`/jobs/${jobId}/fitments`)
      .send({ partId, quantity: 4 });
    expect(res.status).toBe(409);

    const part = await api(app).get(`/parts/${partId}`);
    expect(part.body.onHand).toBe(3);
  });
});
