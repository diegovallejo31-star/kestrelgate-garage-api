import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeCourtesyCar, makeSite } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('courtesy_cars over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    expect(made.status).toBe(201);
    expect(made.body.status).toBe('available');

    const listed = await api(app).get(`/sites/${siteId}/courtesy-cars`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    expect(Object.keys(made.body).sort()).toEqual([
      'createdAt',
      'id',
      'model',
      'registration',
      'seats',
      'siteId',
      'status',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    const read = await api(app).get(`/courtesy-cars/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/courtesy-cars/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5, nonesuch: 1 });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app).get(`/sites/${siteId}/courtesy-cars?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same registration', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const first = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    expect(again.status).toBe(409);
  });

  it('amends the one field and leaves the rest alone', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    const patched = await api(app)
      .patch(`/courtesy-cars/${made.body.id}`)
      .send({ seats: 4 });
    expect(patched.status).toBe(200);
    expect(patched.body.seats).toEqual(4);
  });

  it('refuses an empty amendment', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/sites/${siteId}/courtesy-cars`)
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    const patched = await api(app).patch(`/courtesy-cars/${made.body.id}`).send({});
    expect(patched.status).toBe(400);
  });

  it('404s when the site is not there', async () => {
    const app = buildApp();

    const res = await api(app)
      .post('/sites/999999/courtesy-cars')
      .send({ registration: 'KG20CTY', model: 'Vauxhall Corsa', seats: 5 });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);
    await makeCourtesyCar(app, { siteId });
    await makeCourtesyCar(app, { siteId });

    const all = await api(app).get(`/sites/${siteId}/courtesy-cars`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/sites/${siteId}/courtesy-cars?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/courtesy-cars/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app).get(`/sites/${siteId}/courtesy-cars?limit=0`);
    expect(res.status).toBe(400);
  });

  it('404s when amending one that is not there', async () => {
    const app = buildApp();

    const res = await api(app).patch('/courtesy-cars/999999').send({ seats: 4 });
    expect(res.status).toBe(404);
  });

  it('lends a car out and takes it back, and refuses a double loan', async () => {
    const app = buildApp();
    const carId = await makeCourtesyCar(app);

    const out = await api(app)
      .post(`/courtesy-cars/${carId}/status`)
      .send({ status: 'on_loan' });
    expect(out.status).toBe(200);
    expect(out.body.status).toBe('on_loan');

    const offRoad = await api(app)
      .post(`/courtesy-cars/${carId}/status`)
      .send({ status: 'off_road' });
    expect(offRoad.status).toBe(409);

    const back = await api(app)
      .post(`/courtesy-cars/${carId}/status`)
      .send({ status: 'available' });
    expect(back.status).toBe(200);
  });

  it('keeps the available ones on their own list', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const first = await makeCourtesyCar(app, { siteId });
    await makeCourtesyCar(app, { siteId });
    await api(app).post(`/courtesy-cars/${first}/status`).send({ status: 'on_loan' });

    const available = await api(app).get(
      `/sites/${siteId}/courtesy-cars?status=available`,
    );
    expect(available.status).toBe(200);
    expect(available.body.items).toHaveLength(1);
  });
});
