export interface Technician {
  id: number;
  siteId: number;
  /** Clock number, unique within the branch. */
  clockNumber: string;
  name: string;
  /** What they are signed off to do. */
  grade: 'apprentice' | 'technician' | 'master' | 'mot_tester';
  /** Charged out per hour, in whole pence. */
  labourRatePence: number;
  /** First day on the payroll. */
  startedOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianRow {
  id: number;
  site_id: number;
  clock_number: string;
  name: string;
  grade: 'apprentice' | 'technician' | 'master' | 'mot_tester';
  labour_rate_pence: number;
  started_on: string;
  created_at: string;
  updated_at: string;
}

export interface TechnicianDraft {
  clockNumber: string;
  name: string;
  grade: 'apprentice' | 'technician' | 'master' | 'mot_tester';
  labourRatePence: number;
  startedOn: string;
}

export interface NewTechnician extends TechnicianDraft {
  siteId: number;
}

export interface TechnicianPatch {
  grade?: 'apprentice' | 'technician' | 'master' | 'mot_tester';
  labourRatePence?: number;
}
