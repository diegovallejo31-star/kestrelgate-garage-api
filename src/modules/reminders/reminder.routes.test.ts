import type { Express } from 'express';
import { createApp } from '../../app';
import { api } from '../../../tests/apiClient';
import { createTestDb } from '../../../tests/testDb';
import { makeReminder, makeVehicle } from '../../../tests/factories';

function buildApp(): Express {
  return createApp(createTestDb());
}

describe('reminders over the wire', () => {
  it('takes a new one and lists it back', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const made = await api(app).post(`/vehicles/${vehicleId}/reminders`).send({
      kind: 'mot_due',
      dueOn: '2025-05-01',
      note: 'MOT runs out on the 10th - book it in.',
    });
    expect(made.status).toBe(201);
    expect(made.body.status).toBe('scheduled');

    const listed = await api(app).get(`/vehicles/${vehicleId}/reminders`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
  });

  it('answers one with exactly the fields it promises', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const made = await api(app).post(`/vehicles/${vehicleId}/reminders`).send({
      kind: 'mot_due',
      dueOn: '2025-05-01',
      note: 'MOT runs out on the 10th - book it in.',
    });
    expect(Object.keys(made.body).sort()).toEqual([
      'createdAt',
      'dueOn',
      'id',
      'kind',
      'note',
      'status',
      'updatedAt',
      'vehicleId',
    ]);
  });

  it('reads one back by its id, and 404s for one that is not there', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const made = await api(app).post(`/vehicles/${vehicleId}/reminders`).send({
      kind: 'mot_due',
      dueOn: '2025-05-01',
      note: 'MOT runs out on the 10th - book it in.',
    });
    const read = await api(app).get(`/reminders/${made.body.id}`);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(made.body.id);

    const missing = await api(app).get('/reminders/999999');
    expect(missing.status).toBe(404);
  });

  it('turns down a body carrying a field it does not know', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).post(`/vehicles/${vehicleId}/reminders`).send({
      kind: 'mot_due',
      dueOn: '2025-05-01',
      note: 'MOT runs out on the 10th - book it in.',
      nonesuch: 1,
    });
    expect(res.status).toBe(400);
  });

  it('turns down a query it does not know', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).get(`/vehicles/${vehicleId}/reminders?nonesuch=1`);
    expect(res.status).toBe(400);
  });

  it('404s when the vehicle is not there', async () => {
    const app = buildApp();

    const res = await api(app).post('/vehicles/999999/reminders').send({
      kind: 'mot_due',
      dueOn: '2025-05-01',
      note: 'MOT runs out on the 10th - book it in.',
    });
    expect(res.status).toBe(404);
  });

  it('gives back only as many as were asked for', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);
    await makeReminder(app, { vehicleId });
    await makeReminder(app, { vehicleId });

    const all = await api(app).get(`/vehicles/${vehicleId}/reminders`);
    expect(all.body.items).toHaveLength(2);

    const one = await api(app).get(`/vehicles/${vehicleId}/reminders?limit=1`);
    expect(one.body.items).toHaveLength(1);
  });

  it('turns down an id that is not a number', async () => {
    const app = buildApp();

    const res = await api(app).get('/reminders/not-an-id');
    expect(res.status).toBe(400);
  });

  it('turns down a page size of nothing', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const res = await api(app).get(`/vehicles/${vehicleId}/reminders?limit=0`);
    expect(res.status).toBe(400);
  });

  it('sends a reminder once and will not touch it again', async () => {
    const app = buildApp();
    const reminderId = await makeReminder(app);

    const sent = await api(app)
      .post(`/reminders/${reminderId}/status`)
      .send({ status: 'sent' });
    expect(sent.status).toBe(200);
    expect(sent.body.status).toBe('sent');

    const again = await api(app)
      .post(`/reminders/${reminderId}/status`)
      .send({ status: 'dismissed' });
    expect(again.status).toBe(409);
  });

  it('keeps the scheduled ones to itself', async () => {
    const app = buildApp();
    const vehicleId = await makeVehicle(app);

    const first = await makeReminder(app, { vehicleId });
    await makeReminder(app, { vehicleId });
    await api(app).post(`/reminders/${first}/status`).send({ status: 'sent' });

    const scheduled = await api(app).get(
      `/vehicles/${vehicleId}/reminders?status=scheduled`,
    );
    expect(scheduled.status).toBe(200);
    expect(scheduled.body.items).toHaveLength(1);
  });
});
