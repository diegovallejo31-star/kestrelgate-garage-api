/** Whether the work is finished. */
export type JobStatus = 'open' | 'done';

export const JOB_STATUSES: JobStatus[] = ['open', 'done'];

export interface Job {
  id: number;
  bookingId: number;
  /** Who did it. */
  technicianId: number;
  /** What was done, in the words that go on the invoice. */
  description: string;
  /** Time booked, in tenths of an hour. 15 is an hour and a half. */
  labourTenths: number;
  /** What the labour comes to, fixed when the job was raised. */
  labourPence: number;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobRow {
  id: number;
  booking_id: number;
  technician_id: number;
  description: string;
  labour_tenths: number;
  labour_pence: number;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobDraft {
  technicianId: number;
  description: string;
  labourTenths: number;
}

export interface NewJob extends JobDraft {
  bookingId: number;
  labourPence: number;
}
