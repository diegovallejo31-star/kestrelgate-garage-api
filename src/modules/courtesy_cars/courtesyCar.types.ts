/** Whether the car can be lent out right now. */
export type CourtesyCarStatus = 'available' | 'on_loan' | 'off_road';

export const COURTESY_CAR_STATUSES: CourtesyCarStatus[] = [
  'available',
  'on_loan',
  'off_road',
];

export interface CourtesyCar {
  id: number;
  siteId: number;
  /** The courtesy car's own plate. */
  registration: string;
  /** What it is, so the desk knows what they are lending. */
  model: string;
  /** How many it seats, for a customer who needs the room. */
  seats: number;
  status: CourtesyCarStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourtesyCarRow {
  id: number;
  site_id: number;
  registration: string;
  model: string;
  seats: number;
  status: CourtesyCarStatus;
  created_at: string;
  updated_at: string;
}

export interface CourtesyCarDraft {
  registration: string;
  model: string;
  seats: number;
}

export interface NewCourtesyCar extends CourtesyCarDraft {
  siteId: number;
}

export interface CourtesyCarPatch {
  seats?: number;
}
