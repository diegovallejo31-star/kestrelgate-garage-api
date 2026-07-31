export interface Vehicle {
  id: number;
  customerId: number;
  /** Number plate, without spaces, upper case. */
  registration: string;
  make: string;
  model: string;
  /** Decides which of the MOT emissions checks apply. */
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  /** Engine capacity in cc; 0 for an electric vehicle. */
  engineCc: number;
  /** Date of first registration. */
  firstRegisteredOn: string;
  /** Last mileage anybody wrote down. Only ever goes up. */
  odometerMiles: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRow {
  id: number;
  customer_id: number;
  registration: string;
  make: string;
  model: string;
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  engine_cc: number;
  first_registered_on: string;
  odometer_miles: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleDraft {
  registration: string;
  make: string;
  model: string;
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  engineCc: number;
  firstRegisteredOn: string;
  odometerMiles: number;
}

export interface NewVehicle extends VehicleDraft {
  customerId: number;
}

export interface VehiclePatch {
  odometerMiles?: number;
}
