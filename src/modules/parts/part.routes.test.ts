import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makePart } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('parts over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();

    const made = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    expect(made.status).toBe(201);

    const listed = await api(app).get('/parts');
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();

    const made = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    expect(Object.keys(made.body).sort()).toEqual([
      'createdAt',
      'description',
      'id',
      'markupBasisPoints',
      'onHand',
      'partNumber',
      'tradePricePence',
      'updatedAt',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();

    const made = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    const read = await api(app).get(`/parts/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/parts/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();

    const res = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();

    const res = await api(app).get('/parts?nonesuch=1');
    expect(res.status).toBe(400);
  });

  it('refuses a second one with the same part_number', async () => {
    const app = buildApp();

    const first = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    expect(first.status).toBe(201);

    const again = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    expect(again.status).toBe(409);
  });

  it('amends the one field and leaves the rest alone', async () => {
    const app = buildApp();

    const made = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    const patched = await api(app)
      .patch(`/parts/${made.body.id}`)
      .send({ tradePricePence: 2840 });
    expect(patched.status).toBe(200);
    expect(patched.body.tradePricePence).toEqual(2840);
  });

  it('refuses an empty amendment', async () => {
    const app = buildApp();

    const made = await api(app).post('/parts').send({
      partNumber: 'GDB1330',
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
    });
    const patched = await api(app).patch(`/parts/${made.body.id}`).send({});
    expect(patched.status).toBe(400);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    await makePart(app);
    await makePart(app);

    const all = await api(app).get('/parts');
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get('/parts?limit=1');
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/parts/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();

    const res = await api(app).get('/parts?limit=0');
    expect(res.status).toBe(400);
  });

  it('404s when amending one that is not there', async () => {
    const app = buildApp();

    const res = await api(app).patch('/parts/999999').send({ tradePricePence: 2840 });
    expect(res.status).toBe(404);
  });

  it('will not let the shelf go negative', async () => {
    const app = buildApp();
    const partId = await makePart(app, { onHand: 2 });

    const drawn = await api(app).patch(`/parts/${partId}`).send({ onHand: 0 });
    expect(drawn.status).toBe(200);
    expect(drawn.body.onHand).toBe(0);

    const below = await api(app).patch(`/parts/${partId}`).send({ onHand: -1 });
    expect(below.status).toBe(400);
  });
});
