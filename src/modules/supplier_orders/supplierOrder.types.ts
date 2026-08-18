/** Where the order has got to. */
export type SupplierOrderStatus = 'ordered' | 'received' | 'cancelled';

export const SUPPLIER_ORDER_STATUSES: SupplierOrderStatus[] = [
  'ordered',
  'received',
  'cancelled',
];

export interface SupplierOrder {
  id: number;
  partId: number;
  /** The factor's order reference. */
  reference: string;
  /** The day the order went in. */
  orderedOn: string;
  /** How many were ordered. */
  quantity: number;
  status: SupplierOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderRow {
  id: number;
  part_id: number;
  reference: string;
  ordered_on: string;
  quantity: number;
  status: SupplierOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface SupplierOrderDraft {
  reference: string;
  orderedOn: string;
  quantity: number;
}

export interface NewSupplierOrder extends SupplierOrderDraft {
  partId: number;
}
