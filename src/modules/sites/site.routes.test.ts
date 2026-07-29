import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeSite } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('sites over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();

    const made = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    expect(made.status).toBe(201);

    const listed = await api(app).get('/sites');
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();

    const made = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    expect(Object.keys(made.body).sort()).toEqual([
      'code',
      'createdAt',
      'id',
      'name',
      'openedOn',
      'ramps',
      'town',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();

    const made = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    const read = await api(app).get(`/sites/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/sites/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();

    const res = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
        nonesuch: 1,
      });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();

    const res = await api(app).get('/sites?nonesuch=1');
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same code', async () => {
    const app = buildApp();

    const first = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    expect(again.status).toBe(409);
  });

  it('amends the one field and leaves the rest alone', async () => {
    const app = buildApp();

    const made = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    const patched = await api(app).patch(`/sites/${made.body.id}`).send({ ramps: 6 });
    expect(patched.status).toBe(200);
    expect(patched.body.ramps).toEqual(6);
  });

  it('refuses an empty amendment', async () => {
    const app = buildApp();

    const made = await api(app)
      .post('/sites')
      .send({
        code: 'BRN',
        name: 'Barnhill',
        town: 'Barnhill',
        ramps: 6,
        openedOn: '2019-03-04',
      });
    const patched = await api(app).patch(`/sites/${made.body.id}`).send({});
    expect(patched.status).toBe(400);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    await makeSite(app);
    await makeSite(app);

    const all = await api(app).get('/sites');
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get('/sites?limit=1');
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/sites/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();

    const res = await api(app).get('/sites?limit=0');
    expect(res.status).toBe(400);
  });

  it('404s when amending one that is not there', async () => {
    const app = buildApp();

    const res = await api(app).patch('/sites/999999').send({ ramps: 6 });
    expect(res.status).toBe(404);
  });
});
