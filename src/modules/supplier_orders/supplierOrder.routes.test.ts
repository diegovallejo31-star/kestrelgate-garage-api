import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makePart, makeSupplierOrder } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('supplier_orders over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const made = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20 });
    expect(made.status).toBe(201);
    expect(made.body.status).toBe('ordered');

    const listed = await api(app).get(`/parts/${partId}/orders`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const made = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20 });
    expect(Object.keys(made.body).sort()).toEqual([
      'createdAt',
      'id',
      'orderedOn',
      'partId',
      'quantity',
      'reference',
      'status',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const made = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20 });
    const read = await api(app).get(`/orders/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/orders/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const res = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20, nonesuch: 1 });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const res = await api(app).get(`/parts/${partId}/orders?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same reference', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const first = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20 });
    expect(first.status).toBe(201);

    const again = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20 });
    expect(again.status).toBe(409);
  });

  it('404s when the part is not there', async () => {
    const app = buildApp();

    const res = await api(app)
      .post('/parts/999999/orders')
      .send({ reference: 'PO-5500', orderedOn: '2025-04-10', quantity: 20 });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const partId = await makePart(app);
    await makeSupplierOrder(app, { partId });
    await makeSupplierOrder(app, { partId });

    const all = await api(app).get(`/parts/${partId}/orders`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/parts/${partId}/orders?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/orders/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const partId = await makePart(app);

    const res = await api(app).get(`/parts/${partId}/orders?limit=0`);
    expect(res.status).toBe(400);
  });

  it('puts the stock on the shelf when the order is received', async () => {
    const app = buildApp();
    const partId = await makePart(app, { onHand: 4 });

    const order = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5501', orderedOn: '2025-04-10', quantity: 20 });
    expect(order.status).toBe(201);

    const received = await api(app)
      .post(`/orders/${order.body.id}/status`)
      .send({ status: 'received' });
    expect(received.status).toBe(200);

    const part = await api(app).get(`/parts/${partId}`);
    expect(part.body.onHand).toBe(24);
  });

  it('leaves the stock alone when the order is cancelled', async () => {
    const app = buildApp();
    const partId = await makePart(app, { onHand: 4 });

    const order = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5502', orderedOn: '2025-04-10', quantity: 20 });
    await api(app).post(`/orders/${order.body.id}/status`).send({ status: 'cancelled' });

    const part = await api(app).get(`/parts/${partId}`);
    expect(part.body.onHand).toBe(4);
  });

  it('will not receive the same order twice', async () => {
    const app = buildApp();
    const partId = await makePart(app, { onHand: 0 });

    const order = await api(app)
      .post(`/parts/${partId}/orders`)
      .send({ reference: 'PO-5503', orderedOn: '2025-04-10', quantity: 5 });
    await api(app).post(`/orders/${order.body.id}/status`).send({ status: 'received' });

    const again = await api(app)
      .post(`/orders/${order.body.id}/status`)
      .send({ status: 'received' });
    expect(again.status).toBe(409);

    const part = await api(app).get(`/parts/${partId}`);
    expect(part.body.onHand).toBe(5);
  });
});
