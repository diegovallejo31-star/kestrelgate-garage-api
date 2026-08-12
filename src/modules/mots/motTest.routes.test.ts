import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeMotTest, makeVehicle } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('mots over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const made = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    expect(made.status).toBe(201);

    const listed = await api(app).get(`/vehicles/${vehicleId}/mot-tests`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const made = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    expect(Object.keys(made.body).sort()).toEqual([
      'certificateNumber',
      'createdAt',
      'expiresOn',
      'id',
      'odometerMiles',
      'result',
      'testedOn',
      'updatedAt',
      'vehicleId',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const made = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    const read = await api(app).get(`/mot-tests/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/mot-tests/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).get(`/vehicles/${vehicleId}/mot-tests?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same certificate_number', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const first = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    expect(first.status).toBe(201);

    const again = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    expect(again.status).toBe(409);
  });

  it('404s when the vehicle is not there', async () => {
    const app = buildApp();

    const res = await api(app).post('/vehicles/999999/mot-tests').send({
      certificateNumber: 'C41220118',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    await makeMotTest(app, { vehicleId });
    await makeMotTest(app, { vehicleId });

    const all = await api(app).get(`/vehicles/${vehicleId}/mot-tests`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/vehicles/${vehicleId}/mot-tests?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/mot-tests/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).get(`/vehicles/${vehicleId}/mot-tests?limit=0`);
    expect(res.status).toBe(400);
  });

  it('will not record a test from before the vehicle existed', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C99000111',
      testedOn: '2018-01-04',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2019-01-03',
    });
    expect(res.status).toBe(400);
  });

  it('wants an expiry on a pass and refuses one on a fail', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const passWithout = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C99000222',
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
    });
    expect(passWithout.status).toBe(400);

    const failWith = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C99000333',
      testedOn: '2024-03-11',
      result: 'fail',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
    });
    expect(failWith.status).toBe(400);

    const fail = await api(app).post(`/vehicles/${vehicleId}/mot-tests`).send({
      certificateNumber: 'C99000444',
      testedOn: '2024-03-11',
      result: 'fail',
      odometerMiles: 64000,
    });
    expect(fail.status).toBe(201);
  });
});
