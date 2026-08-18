import type { Express } from 'express';
import { api } from './apiClient';

/**
 * Makers for the tests.
 *
 * Each one creates the least it can get away with and hands back an id, so a
 * test that cares about charges does not have to know how a site is spelt.
 * Counters keep every generated code unique inside one run.
 */
let seq = 0;

function next(): number {
  seq += 1;
  return seq;
}

export async function makeSite(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const res = await api(app)
    .post('/sites')
    .send({
      code: `BRN${n}`,
      name: 'Barnhill',
      town: 'Barnhill',
      ramps: 6,
      openedOn: '2019-03-04',
      ...fields,
    });
  if (res.status !== 201) {
    throw new Error(`makeSite: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeTechnician(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { siteId: parent, ...rest } = fields as { siteId?: number };
  const siteId = parent ?? (await makeSite(app));
  const res = await api(app)
    .post(`/sites/${siteId}/technicians`)
    .send({
      clockNumber: `14${n}`,
      name: 'Ravi Chauhan',
      grade: 'technician',
      labourRatePence: 8400,
      startedOn: '2021-06-01',
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeTechnician: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeCustomer(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const res = await api(app)
    .post('/customers')
    .send({
      accountRef: `AC-1042${n}`,
      name: 'Hollis Groundworks',
      phone: '01642 770118',
      openedOn: '2020-11-16',
      onAccount: true,
      ...fields,
    });
  if (res.status !== 201) {
    throw new Error(`makeCustomer: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeVehicle(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { customerId: parent, ...rest } = fields as { customerId?: number };
  const customerId = parent ?? (await makeCustomer(app));
  const res = await api(app)
    .post(`/customers/${customerId}/vehicles`)
    .send({
      registration: `YT19WGK${n}`,
      make: 'Ford',
      model: 'Transit',
      fuel: 'diesel',
      engineCc: 1995,
      firstRegisteredOn: '2019-05-02',
      odometerMiles: 64000,
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeVehicle: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makePart(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const res = await api(app)
    .post('/parts')
    .send({
      partNumber: `GDB1330${n}`,
      description: 'Front brake pad set',
      tradePricePence: 2840,
      markupBasisPoints: 2500,
      onHand: 12,
      ...fields,
    });
  if (res.status !== 201) {
    throw new Error(`makePart: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeBooking(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { vehicleId: parent, ...rest } = fields as { vehicleId?: number };
  const vehicleId = parent ?? (await makeVehicle(app));
  const siteId = await makeSite(app);
  const res = await api(app)
    .post(`/vehicles/${vehicleId}/bookings`)
    .send({
      siteId: siteId,
      bookedFor: '2025-04-14',
      reason: 'Grinding on the front',
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeBooking: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeJob(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { bookingId: parent, ...rest } = fields as { bookingId?: number };
  const bookingId = parent ?? (await makeBooking(app));
  const technicianId = await makeTechnician(app);
  const res = await api(app)
    .post(`/bookings/${bookingId}/jobs`)
    .send({
      technicianId: technicianId,
      description: 'Front pads and discs',
      labourTenths: 15,
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeJob: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeFitment(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { jobId: parent, ...rest } = fields as { jobId?: number };
  const jobId = parent ?? (await makeJob(app));
  const partId = await makePart(app, { onHand: 50 });
  const res = await api(app)
    .post(`/jobs/${jobId}/fitments`)
    .send({
      partId: partId,
      quantity: 2,
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeFitment: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeMotTest(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { vehicleId: parent, ...rest } = fields as { vehicleId?: number };
  const vehicleId = parent ?? (await makeVehicle(app));
  const res = await api(app)
    .post(`/vehicles/${vehicleId}/mot-tests`)
    .send({
      certificateNumber: `C41220118${n}`,
      testedOn: '2024-03-11',
      result: 'pass',
      odometerMiles: 64000,
      expiresOn: '2025-03-10',
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeMotTest: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeInvoice(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const bookingId = await makeBooking(app);
  const technicianId = await makeTechnician(app, { labourRatePence: 8400 });
  await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'in_progress' });
  await api(app)
    .post(`/bookings/${bookingId}/jobs`)
    .send({ technicianId, description: 'Hour of labour', labourTenths: 10 });
  await api(app).post(`/bookings/${bookingId}/status`).send({ status: 'completed' });
  const res = await api(app)
    .post('/invoices')
    .send({
      bookingId: bookingId,
      number: `INV-4471${n}`,
      raisedOn: '2025-04-16',
      ...fields,
    });
  if (res.status !== 201) {
    throw new Error(`makeInvoice: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makePayment(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const invoiceId = await makeInvoice(app);
  const res = await api(app)
    .post('/payments')
    .send({
      invoiceId: invoiceId,
      paidOn: '2025-04-18',
      method: 'card',
      amountPence: 1000,
      ...fields,
    });
  if (res.status !== 201) {
    throw new Error(`makePayment: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}

export async function makeReminder(
  app: Express,
  fields: Record<string, unknown> = {},
): Promise<number> {
  const n = next();
  const { vehicleId: parent, ...rest } = fields as { vehicleId?: number };
  const vehicleId = parent ?? (await makeVehicle(app));
  const res = await api(app)
    .post(`/vehicles/${vehicleId}/reminders`)
    .send({
      kind: 'mot_due',
      dueOn: '2025-05-01',
      note: 'MOT runs out on the 10th - book it in.',
      ...rest,
    });
  if (res.status !== 201) {
    throw new Error(`makeReminder: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.id as number;
}
