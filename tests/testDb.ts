import { openDatabase, type Database } from '../src/db/client';

/** A fresh in-memory database, so one test can never see another's rows. */
export function createTestDb(): Database {
  return openDatabase(':memory:');
}
