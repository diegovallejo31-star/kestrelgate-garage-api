export interface Invoice {
  id: number;
  /** The visit this bill is for. One invoice per booking. */
  bookingId: number;
  /** The invoice number as it appears on the paperwork. */
  number: string;
  /** The day the invoice was raised. */
  raisedOn: string;
  /** Labour on the booking. */
  labourPence: number;
  /** Parts fitted to the booking. */
  partsPence: number;
  /** Labour plus parts, before VAT. */
  netPence: number;
  /** VAT on the net, at the standard rate. */
  vatPence: number;
  /** What the customer owes. */
  grossPence: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRow {
  id: number;
  booking_id: number;
  number: string;
  raised_on: string;
  labour_pence: number;
  parts_pence: number;
  net_pence: number;
  vat_pence: number;
  gross_pence: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceDraft {
  bookingId: number;
  number: string;
  raisedOn: string;
}

export interface NewInvoice extends InvoiceDraft {
  labourPence: number;
  partsPence: number;
  netPence: number;
  vatPence: number;
  grossPence: number;
}
