export interface Site {
  id: number;
  /** Short branch code the group uses on paperwork. */
  code: string;
  name: string;
  /** Where the branch is, for the customer-facing pages. */
  town: string;
  /** How many vehicles the workshop can have up at once. */
  ramps: number;
  /** The day the branch opened, YYYY-MM-DD. */
  openedOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteRow {
  id: number;
  code: string;
  name: string;
  town: string;
  ramps: number;
  opened_on: string;
  created_at: string;
  updated_at: string;
}

export interface SiteDraft {
  code: string;
  name: string;
  town: string;
  ramps: number;
  openedOn: string;
}

export type NewSite = SiteDraft;

export interface SitePatch {
  ramps?: number;
}
