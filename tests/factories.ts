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
