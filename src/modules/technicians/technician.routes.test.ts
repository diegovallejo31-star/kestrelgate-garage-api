import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeSite, makeTechnician } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('technicians over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    expect(made.status).toBe(201);

    const listed = await api(app).get(`/sites/${siteId}/technicians`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    expect(Object.keys(made.body).sort()).toEqual([
      'clockNumber',
      'createdAt',
      'grade',
      'id',
      'labourRatePence',
      'name',
      'siteId',
      'startedOn',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    const read = await api(app).get(`/technicians/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/technicians/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app).get(`/sites/${siteId}/technicians?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same clock_number', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const first = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    expect(first.status).toBe(201);

    const again = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    expect(again.status).toBe(409);
  });

  it('amends the one field and leaves the rest alone', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    const patched = await api(app)
      .patch(`/technicians/${made.body.id}`)
      .send({ grade: 'technician' });
    expect(patched.status).toBe(200);
    expect(patched.body.grade).toEqual('technician');
  });

  it('refuses an empty amendment', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app).post(`/sites/${siteId}/technicians`).send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    const patched = await api(app).patch(`/technicians/${made.body.id}`).send({});
    expect(patched.status).toBe(400);
  });

  it('404s when the site is not there', async () => {
    const app = buildApp();

    const res = await api(app).post('/sites/999999/technicians').send({
      clockNumber: '14',
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
    });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);
    await makeTechnician(app, { siteId });
    await makeTechnician(app, { siteId });

    const all = await api(app).get(`/sites/${siteId}/technicians`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/sites/${siteId}/technicians?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/technicians/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app).get(`/sites/${siteId}/technicians?limit=0`);
    expect(res.status).toBe(400);
  });

  it('404s when amending one that is not there', async () => {
    const app = buildApp();

    const res = await api(app).patch('/technicians/999999').send({ grade: 'technician' });
    expect(res.status).toBe(404);
  });
});
