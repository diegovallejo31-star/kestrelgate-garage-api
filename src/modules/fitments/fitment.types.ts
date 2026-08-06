export interface Fitment {
  id: number;
  jobId: number;
  /** Which catalogue line was fitted. */
  partId: number;
  /** How many went on. */
  quantity: number;
  /** Retail price of one, fixed at the moment of fitting. */
  unitPricePence: number;
  /** Unit price times quantity. */
  linePence: number;
  createdAt: string;
  updatedAt: string;
}

export interface FitmentRow {
  id: number;
  job_id: number;
  part_id: number;
  quantity: number;
  unit_price_pence: number;
  line_pence: number;
  created_at: string;
  updated_at: string;
}

export interface FitmentDraft {
  partId: number;
  quantity: number;
}

export interface NewFitment extends FitmentDraft {
  jobId: number;
  unitPricePence: number;
  linePence: number;
}
