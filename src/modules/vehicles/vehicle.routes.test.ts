import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeCustomer, makeVehicle } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('vehicles over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const made = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    expect(made.status).toBe(201);

    const listed = await api(app).get(`/customers/${customerId}/vehicles`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const made = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    expect(Object.keys(made.body).sort()).toEqual([
      'createdAt',
      'customerId',
      'engineCc',
      'firstRegisteredOn',
      'fuel',
      'id',
      'make',
      'model',
      'odometerMiles',
      'registration',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const made = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    const read = await api(app).get(`/vehicles/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/vehicles/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const res = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
        nonesuch: 1,
      });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const res = await api(app).get(`/customers/${customerId}/vehicles?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same registration', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const first = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    expect(again.status).toBe(409);
  });

  it('amends the one field and leaves the rest alone', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const made = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    const patched = await api(app)
      .patch(`/vehicles/${made.body.id}`)
      .send({ odometerMiles: 71250 });
    expect(patched.status).toBe(200);
    expect(patched.body.odometerMiles).toEqual(71250);
  });

  it('refuses an empty amendment', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const made = await api(app)
      .post(`/customers/${customerId}/vehicles`)
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    const patched = await api(app).patch(`/vehicles/${made.body.id}`).send({});
    expect(patched.status).toBe(400);
  });

  it('404s when the customer is not there', async () => {
    const app = buildApp();

    const res = await api(app)
      .post('/customers/999999/vehicles')
      .send({
        registration: 'YT19WGK',
        make: 'Ford',
        model: 'Transit',
        fuel: 'diesel',
        engineCc: 1995,
        firstRegisteredOn: '2019-05-02',
        odometerMiles: 64000,
      });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);
    await makeVehicle(app, { customerId });
    await makeVehicle(app, { customerId });

    const all = await api(app).get(`/customers/${customerId}/vehicles`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/customers/${customerId}/vehicles?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/vehicles/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const customerId = await makeCustomer(app);

    const res = await api(app).get(`/customers/${customerId}/vehicles?limit=0`);
    expect(res.status).toBe(400);
  });

  it('404s when amending one that is not there', async () => {
    const app = buildApp();

    const res = await api(app).patch('/vehicles/999999').send({ odometerMiles: 71250 });
    expect(res.status).toBe(404);
  });

  it('will not wind the odometer back', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app, { odometerMiles: 91000 });

    const forward = await api(app)
      .patch(`/vehicles/${vehicleId}`)
      .send({ odometerMiles: 91500 });
    expect(forward.status).toBe(200);

    const back = await api(app)
      .patch(`/vehicles/${vehicleId}`)
      .send({ odometerMiles: 19000 });
    expect(back.status).toBe(409);
  });

  it('holds a registration once across the whole group', async () => {
    const app = buildApp();
    const one = await makeCustomer(app);
    const other = await makeCustomer(app);

    const first = await api(app).post(`/customers/${one}/vehicles`).send({
      registration: 'YT19WGK',
      make: 'Ford',
      model: 'Transit',
      fuel: 'diesel',
      engineCc: 1995,
      firstRegisteredOn: '2019-05-02',
      odometerMiles: 64000,
    });
    expect(first.status).toBe(201);

    const again = await api(app).post(`/customers/${other}/vehicles`).send({
      registration: 'YT19WGK',
      make: 'Ford',
      model: 'Transit',
      fuel: 'diesel',
      engineCc: 1995,
      firstRegisteredOn: '2019-05-02',
      odometerMiles: 64000,
    });
    expect(again.status).toBe(409);
  });
});
