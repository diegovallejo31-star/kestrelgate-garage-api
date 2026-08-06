import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeBooking, makeJob, makeTechnician } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('jobs over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app);

    const made = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({
        technicianId: technicianId,
        description: 'Front pads and discs',
        labourTenths: 15,
      });
    expect(made.status).toBe(201);
    expect(made.body.status).toBe('open');

    const listed = await api(app).get(`/bookings/${bookingId}/jobs`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app);

    const made = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({
        technicianId: technicianId,
        description: 'Front pads and discs',
        labourTenths: 15,
      });
    expect(Object.keys(made.body).sort()).toEqual([
      'bookingId',
      'createdAt',
      'description',
      'id',
      'labourPence',
      'labourTenths',
      'status',
      'technicianId',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app);

    const made = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({
        technicianId: technicianId,
        description: 'Front pads and discs',
        labourTenths: 15,
      });
    const read = await api(app).get(`/jobs/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/jobs/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app);

    const res = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({
        technicianId: technicianId,
        description: 'Front pads and discs',
        labourTenths: 15,
        nonesuch: 1,
      });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);

    const res = await api(app).get(`/bookings/${bookingId}/jobs?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('404s when the booking is not there', async () => {
    const app = buildApp();
    const technicianId = await makeTechnician(app);

    const res = await api(app)
      .post('/bookings/999999/jobs')
      .send({
        technicianId: technicianId,
        description: 'Front pads and discs',
        labourTenths: 15,
      });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    await makeJob(app, { bookingId });
    await makeJob(app, { bookingId });

    const all = await api(app).get(`/bookings/${bookingId}/jobs`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/bookings/${bookingId}/jobs?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/jobs/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);

    const res = await api(app).get(`/bookings/${bookingId}/jobs?limit=0`);
    expect(res.status).toBe(400);
  });

  it('charges the labour at the technician rate, in tenths', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });

    const made = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Front pads and discs', labourTenths: 15 });

    expect(made.status).toBe(201);
    expect(made.body.labourPence).toBe(12600);
  });

  it('will not take work for a booking that is finished with', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app);
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'cancelled' });

    const res = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Front pads', labourTenths: 10 });
    expect(res.status).toBe(409);
  });

  it('will not reopen a job that has been signed off', async () => {
    const app = buildApp();
    const jobId = await makeJob(app);

    await api(app).post(`/jobs/${jobId}/status`).send({ status: 'done' });
    const again = await api(app).post(`/jobs/${jobId}/status`).send({ status: 'open' });
    expect(again.status).toBe(409);
  });
});
