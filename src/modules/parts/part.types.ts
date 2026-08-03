export interface Part {
  id: number;
  /** The factor's own part number. */
  partNumber: string;
  description: string;
  /** What we pay the factor, in whole pence. */
  tradePricePence: number;
  /** Basis points added to the trade price; 2500 is a quarter on. */
  markupBasisPoints: number;
  /** How many are on the shelf at the moment. */
  onHand: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartRow {
  id: number;
  part_number: string;
  description: string;
  trade_price_pence: number;
  markup_basis_points: number;
  on_hand: number;
  created_at: string;
  updated_at: string;
}

export interface PartDraft {
  partNumber: string;
  description: string;
  tradePricePence: number;
  markupBasisPoints: number;
  onHand: number;
}

export type NewPart = PartDraft;

export interface PartPatch {
  tradePricePence?: number;
  markupBasisPoints?: number;
  onHand?: number;
}
