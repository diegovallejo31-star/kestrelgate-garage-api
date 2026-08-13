import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import {
  makeBooking,
  makeInvoice,
  makePart,
  makeTechnician,
} from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('invoices over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Hour of labour', labourTenths: 10 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const made = await api(app)
      .post('/invoices')
      .send({ bookingId: bookingId, number: 'INV-4471', raisedOn: '2025-04-16' });
    expect(made.status).toBe(201);

    const listed = await api(app).get('/invoices');
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Hour of labour', labourTenths: 10 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const made = await api(app)
      .post('/invoices')
      .send({ bookingId: bookingId, number: 'INV-4471', raisedOn: '2025-04-16' });
    expect(Object.keys(made.body).sort()).toEqual([
      'bookingId',
      'createdAt',
      'grossPence',
      'id',
      'labourPence',
      'netPence',
      'number',
      'partsPence',
      'raisedOn',
      'updatedAt',
      'vatPence',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Hour of labour', labourTenths: 10 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const made = await api(app)
      .post('/invoices')
      .send({ bookingId: bookingId, number: 'INV-4471', raisedOn: '2025-04-16' });
    const read = await api(app).get(`/invoices/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/invoices/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Hour of labour', labourTenths: 10 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const res = await api(app).post('/invoices').send({
      bookingId: bookingId,
      number: 'INV-4471',
      raisedOn: '2025-04-16',
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();

    const res = await api(app).get('/invoices?nonesuch=1');
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same number', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Hour of labour', labourTenths: 10 });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const first = await api(app)
      .post('/invoices')
      .send({ bookingId: bookingId, number: 'INV-4471', raisedOn: '2025-04-16' });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post('/invoices')
      .send({ bookingId: bookingId, number: 'INV-4471', raisedOn: '2025-04-16' });
    expect(again.status).toBe(409);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    await makeInvoice(app);
    await makeInvoice(app);

    const all = await api(app).get('/invoices');
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get('/invoices?limit=1');
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/invoices/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();

    const res = await api(app).get('/invoices?limit=0');
    expect(res.status).toBe(400);
  });

  it('adds up the labour and the parts, and takes VAT on the total', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
    const partId = await makePart(app, {
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 10,
    });

    const job = await api(app)
      .post(`/bookings/${bookingId}/jobs`)
      .send({ technicianId, description: 'Front pads and discs', labourTenths: 15 });
    await api(app).post(`/jobs/${job.body.id}/fitments`).send({ partId, quantity: 2 });

    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const raised = await api(app)
      .post('/invoices')
      .send({ bookingId, number: 'INV-9001', raisedOn: '2025-04-16' });

    expect(raised.status).toBe(201);
    expect(raised.body.labourPence).toBe(12600);
    expect(raised.body.partsPence).toBe(7100);
    expect(raised.body.netPence).toBe(19700);
    expect(raised.body.vatPence).toBe(3940);
    expect(raised.body.grossPence).toBe(23640);
  });

  it('will not invoice a booking that is still in the workshop', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);

    const res = await api(app)
      .post('/invoices')
      .send({ bookingId, number: 'INV-9002', raisedOn: '2025-04-16' });
    expect(res.status).toBe(409);
  });

  it('invoices a booking once', async () => {
    const app = buildApp();
    const bookingId = await makeBooking(app);
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
    await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });

    const first = await api(app)
      .post('/invoices')
      .send({ bookingId, number: 'INV-9003', raisedOn: '2025-04-16' });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post('/invoices')
      .send({ bookingId, number: 'INV-9004', raisedOn: '2025-04-16' });
    expect(again.status).toBe(409);
  });

  it('404s for a booking that is not there', async () => {
    const app = buildApp();

    const res = await api(app)
      .post('/invoices')
      .send({ bookingId: 999999, number: 'INV-9005', raisedOn: '2025-04-16' });
    expect(res.status).toBe(404);
  });
});
