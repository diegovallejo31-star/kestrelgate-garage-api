/** Where a booking has got to, from the service desk's point of view. */
export type BookingStatus =
  'booked' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';

export const BOOKING_STATUSES: BookingStatus[] = [
  'booked',
  'in_progress',
  'awaiting_parts',
  'completed',
  'cancelled',
];

export interface Booking {
  id: number;
  vehicleId: number;
  /** The branch expecting the car. Not the vehicle's owner's branch - there isn't one. */
  siteId: number;
  /** The day the car is due in. */
  bookedFor: string;
  /** What the customer says is wrong with it. */
  reason: string;
  /** Mileage read off the clock when it arrived. */
  odometerIn: number | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRow {
  id: number;
  vehicle_id: number;
  site_id: number;
  booked_for: string;
  reason: string;
  odometer_in: number | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingDraft {
  siteId: number;
  bookedFor: string;
  reason: string;
  odometerIn?: number;
}

export interface NewBooking extends BookingDraft {
  vehicleId: number;
}

export interface BookingPatch {
  odometerIn?: number;
}
