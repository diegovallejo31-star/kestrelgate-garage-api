import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeBooking, makeSite, makeVehicle } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('bookings over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/vehicles/${vehicleId}/bookings`)
      .send({ siteId: siteId, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    expect(made.status).toBe(201);
    expect(made.body.status).toBe('booked');

    const listed = await api(app).get(`/vehicles/${vehicleId}/bookings`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/vehicles/${vehicleId}/bookings`)
      .send({ siteId: siteId, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    expect(Object.keys(made.body).sort()).toEqual([
      'bookedFor',
      'createdAt',
      'id',
      'odometerIn',
      'reason',
      'siteId',
      'status',
      'updatedAt',
      'vehicleId',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/vehicles/${vehicleId}/bookings`)
      .send({ siteId: siteId, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    const read = await api(app).get(`/bookings/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/bookings/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    const siteId = await makeSite(app);

    const res = await api(app).post(`/vehicles/${vehicleId}/bookings`).send({
      siteId: siteId,
      bookedFor: '2025-04-14',
      reason: 'Grinding on the front',
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).get(`/vehicles/${vehicleId}/bookings?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('amends the one field and leaves the rest alone', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/vehicles/${vehicleId}/bookings`)
      .send({ siteId: siteId, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    const patched = await api(app)
      .patch(`/bookings/${made.body.id}`)
      .send({ odometerIn: 64210 });
    expect(patched.status).toBe(200);
    expect(patched.body.odometerIn).toEqual(64210);
  });

  it('refuses an empty amendment', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    const siteId = await makeSite(app);

    const made = await api(app)
      .post(`/vehicles/${vehicleId}/bookings`)
      .send({ siteId: siteId, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    const patched = await api(app).patch(`/bookings/${made.body.id}`).send({});
    expect(patched.status).toBe(400);
  });

  it('404s when the vehicle is not there', async () => {
    const app = buildApp();
    const siteId = await makeSite(app);

    const res = await api(app)
      .post('/vehicles/999999/bookings')
      .send({ siteId: siteId, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    await makeBooking(app, { vehicleId });
    await makeBooking(app, { vehicleId });

    const all = await api(app).get(`/vehicles/${vehicleId}/bookings`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/vehicles/${vehicleId}/bookings?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/bookings/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).get(`/vehicles/${vehicleId}/bookings?limit=0`);
    expect(res.status).toBe(400);
  });

  it('404s when amending one that is not there', async () => {
    const app = buildApp();

    const res = await api(app).patch('/bookings/999999').send({ odometerIn: 64210 });
    expect(res.status).toBe(404);
  });

  it('walks a booking through the workshop', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);

    for (const status of ['in_progress', 'awaiting_parts', 'in_progress', 'completed']) {
      const moved = await api(app).post(`/bookings/${bookingId}/status`).send({ status });
      expect(moved.status).toBe(200);
      expect(moved.body.status).toBe(status);
    }
  });

  it('will not reopen a booking that is finished with', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);

    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'cancelled' });
    const again = await api(app)
      .post(`/bookings/${bookingId}/status`)
      .send({ status: 'in_progress' });
    expect(again.status).toBe(409);
  });

  it('refuses a booking at a branch that is not there', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app)
      .post(`/vehicles/${vehicleId}/bookings`)
      .send({ siteId: 999999, bookedFor: '2025-04-14', reason: 'Grinding on the front' });
    expect(res.status).toBe(404);
  });
});
