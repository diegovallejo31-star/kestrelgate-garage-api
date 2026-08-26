import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeJob, makeWarranty } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('warranties over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const made = await api(app)
      .post(`/jobs/${jobId}/warranties`)
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
      });
    expect(made.status).toBe(201);
    expect(made.body.status).toBe('active');

    const listed = await api(app).get(`/jobs/${jobId}/warranties`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const made = await api(app)
      .post(`/jobs/${jobId}/warranties`)
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
      });
    expect(Object.keys(made.body).sort()).toEqual([
      'coversLabour',
      'coversParts',
      'createdAt',
      'expiresOn',
      'givenOn',
      'id',
      'jobId',
      'reference',
      'status',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const made = await api(app)
      .post(`/jobs/${jobId}/warranties`)
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
      });
    const read = await api(app).get(`/warranties/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/warranties/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const res = await api(app)
      .post(`/jobs/${jobId}/warranties`)
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
        nonesuch: 1,
      });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const res = await api(app).get(`/jobs/${jobId}/warranties?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same reference', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const first = await api(app)
      .post(`/jobs/${jobId}/warranties`)
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
      });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post(`/jobs/${jobId}/warranties`)
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
      });
    expect(again.status).toBe(409);
  });

  it('404s when the job is not there', async () => {
    const app = buildApp();

    const res = await api(app)
      .post('/jobs/999999/warranties')
      .send({
        reference: 'WTY-7000',
        givenOn: '2025-04-16',
        expiresOn: '2026-04-16',
        coversParts: true,
        coversLabour: true,
      });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);
    await makeWarranty(app, { jobId });
    await makeWarranty(app, { jobId });

    const all = await api(app).get(`/jobs/${jobId}/warranties`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/jobs/${jobId}/warranties?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/warranties/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const res = await api(app).get(`/jobs/${jobId}/warranties?limit=0`);
    expect(res.status).toBe(400);
  });

  it('refuses a warranty that covers nothing', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const res = await api(app).post(`/jobs/${jobId}/warranties`).send({
      reference: 'WTY-7001',
      givenOn: '2025-04-16',
      expiresOn: '2026-04-16',
      coversParts: false,
      coversLabour: false,
    });
    expect(res.status).toBe(400);
  });

  it('takes a claim inside the term and stands it down after', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const inTerm = await api(app).post(`/jobs/${jobId}/warranties`).send({
      reference: 'WTY-7002',
      givenOn: '2025-04-16',
      expiresOn: '2026-04-16',
      coversParts: true,
      coversLabour: true,
    });
    const claimed = await api(app)
      .post(`/warranties/${inTerm.body.id}/claim`)
      .send({ claimedOn: '2025-09-01' });
    expect(claimed.status).toBe(200);
    expect(claimed.body.status).toBe('claimed');

    const late = await api(app).post(`/jobs/${jobId}/warranties`).send({
      reference: 'WTY-7003',
      givenOn: '2025-04-16',
      expiresOn: '2025-05-16',
      coversParts: true,
      coversLabour: true,
    });
    const lapsed = await api(app)
      .post(`/warranties/${late.body.id}/claim`)
      .send({ claimedOn: '2025-09-01' });
    expect(lapsed.status).toBe(200);
    expect(lapsed.body.status).toBe('lapsed');
  });

  it('will not claim the same warranty twice', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    const warranty = await api(app).post(`/jobs/${jobId}/warranties`).send({
      reference: 'WTY-7004',
      givenOn: '2025-04-16',
      expiresOn: '2026-04-16',
      coversParts: true,
      coversLabour: true,
    });
    await api(app)
      .post(`/warranties/${warranty.body.id}/claim`)
      .send({ claimedOn: '2025-09-01' });

    const again = await api(app)
      .post(`/warranties/${warranty.body.id}/claim`)
      .send({ claimedOn: '2025-09-02' });
    expect(again.status).toBe(409);
  });
});
