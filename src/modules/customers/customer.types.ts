export interface Customer {
  id: number;
  /** The group's own account reference. */
  accountRef: string;
  name: string;
  /** Whatever number the desk rings when the car is ready. */
  phone: string;
  email: string | null;
  /** The day the account was opened. */
  openedOn: string;
  /** True if they are invoiced monthly rather than on collection. */
  onAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRow {
  id: number;
  account_ref: string;
  name: string;
  phone: string;
  email: string | null;
  opened_on: string;
  on_account: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerDraft {
  accountRef: string;
  name: string;
  phone: string;
  email?: string;
  openedOn: string;
  onAccount?: boolean;
}

export type NewCustomer = CustomerDraft;

export interface CustomerPatch {
  email?: string;
  onAccount?: boolean;
}
