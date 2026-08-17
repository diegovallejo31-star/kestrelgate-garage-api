import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeInvoice, makePayment } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('payments over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const invoiceId = await makeInvoice(app);

    const made = await api(app).post('/payments').send({
      invoiceId: invoiceId,
      paidOn: '2025-04-18',
      method: 'card',
      amountPence: 1000,
    });
    expect(made.status).toBe(201);

    const listed = await api(app).get('/payments');
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const invoiceId = await makeInvoice(app);

    const made = await api(app).post('/payments').send({
      invoiceId: invoiceId,
      paidOn: '2025-04-18',
      method: 'card',
      amountPence: 1000,
    });
    expect(Object.keys(made.body).sort()).toEqual([
      'amountPence',
      'createdAt',
      'id',
      'invoiceId',
      'method',
      'paidOn',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const invoiceId = await makeInvoice(app);

    const made = await api(app).post('/payments').send({
      invoiceId: invoiceId,
      paidOn: '2025-04-18',
      method: 'card',
      amountPence: 1000,
    });
    const read = await api(app).get(`/payments/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/payments/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const invoiceId = await makeInvoice(app);

    const res = await api(app).post('/payments').send({
      invoiceId: invoiceId,
      paidOn: '2025-04-18',
      method: 'card',
      amountPence: 1000,
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();

    const res = await api(app).get('/payments?nonesuch=1');
    expect(res.status).toBe(400);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    await makePayment(app);
    await makePayment(app);

    const all = await api(app).get('/payments');
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get('/payments?limit=1');
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/payments/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();

    const res = await api(app).get('/payments?limit=0');
    expect(res.status).toBe(400);
  });

  it('brings the outstanding balance down and refuses an overpayment', async () => {
    const app = buildApp();
    const invoiceId = await makeInvoice(app);

    const before = await api(app).get(`/payments/invoice/${invoiceId}/outstanding`);
    expect(before.status).toBe(200);
    const gross = before.body.grossPence as number;
    expect(before.body.outstandingPence).toBe(gross);

    const part = await api(app)
      .post('/payments')
      .send({ invoiceId, paidOn: '2025-04-18', method: 'card', amountPence: 1000 });
    expect(part.status).toBe(201);

    const mid = await api(app).get(`/payments/invoice/${invoiceId}/outstanding`);
    expect(mid.body.paidPence).toBe(1000);
    expect(mid.body.outstandingPence).toBe(gross - 1000);

    const tooMuch = await api(app)
      .post('/payments')
      .send({ invoiceId, paidOn: '2025-04-19', method: 'cash', amountPence: gross });
    expect(tooMuch.status).toBe(409);

    const settle = await api(app)
      .post('/payments')
      .send({
        invoiceId,
        paidOn: '2025-04-19',
        method: 'account',
        amountPence: gross - 1000,
      });
    expect(settle.status).toBe(201);

    const after = await api(app).get(`/payments/invoice/${invoiceId}/outstanding`);
    expect(after.body.outstandingPence).toBe(0);
  });
});
