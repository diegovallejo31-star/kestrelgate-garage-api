export interface MotTest {
  id: number;
  vehicleId: number;
  /** The DVSA certificate number. */
  certificateNumber: string;
  /** The day of the test. */
  testedOn: string;
  /** What the tester recorded. */
  result: 'pass' | 'fail';
  /** Mileage on the certificate. */
  odometerMiles: number;
  /** When the certificate runs out. A fail does not have one. */
  expiresOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MotTestRow {
  id: number;
  vehicle_id: number;
  certificate_number: string;
  tested_on: string;
  result: 'pass' | 'fail';
  odometer_miles: number;
  expires_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface MotTestDraft {
  certificateNumber: string;
  testedOn: string;
  result: 'pass' | 'fail';
  odometerMiles: number;
  expiresOn?: string;
}

export interface NewMotTest extends MotTestDraft {
  vehicleId: number;
}
