/** Whether the guarantee still stands. */
export type WarrantyStatus = 'active' | 'claimed' | 'lapsed';

export const WARRANTY_STATUSES: WarrantyStatus[] = ['active', 'claimed', 'lapsed'];

export interface Warranty {
  id: number;
  jobId: number;
  /** The guarantee reference given to the customer. */
  reference: string;
  /** The day the guarantee was given. */
  givenOn: string;
  /** The day it lapses; claims after this do not stand. */
  expiresOn: string;
  /** Whether the parts on the job are covered. Stated explicitly, not assumed. */
  coversParts: boolean;
  /** Whether the labour on the job is covered. Stated explicitly, not assumed. */
  coversLabour: boolean;
  status: WarrantyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyRow {
  id: number;
  job_id: number;
  reference: string;
  given_on: string;
  expires_on: string;
  covers_parts: number;
  covers_labour: number;
  status: WarrantyStatus;
  created_at: string;
  updated_at: string;
}

export interface WarrantyDraft {
  reference: string;
  givenOn: string;
  expiresOn: string;
  coversParts: boolean;
  coversLabour: boolean;
}

export interface NewWarranty extends WarrantyDraft {
  jobId: number;
}
