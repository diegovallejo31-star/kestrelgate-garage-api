export interface Payment {
  id: number;
  /** The invoice being paid. */
  invoiceId: number;
  /** The day the money came in. */
  paidOn: string;
  /** How it was paid. */
  method: 'card' | 'cash' | 'bank_transfer' | 'account';
  /** How much, in whole pence. Always positive. */
  amountPence: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRow {
  id: number;
  invoice_id: number;
  paid_on: string;
  method: 'card' | 'cash' | 'bank_transfer' | 'account';
  amount_pence: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentDraft {
  invoiceId: number;
  paidOn: string;
  method: 'card' | 'cash' | 'bank_transfer' | 'account';
  amountPence: number;
}

export type NewPayment = PaymentDraft;
