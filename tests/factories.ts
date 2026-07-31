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
