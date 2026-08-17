/** Whether the reminder has gone out yet. */
export type ReminderStatus = 'scheduled' | 'sent' | 'dismissed';

export const REMINDER_STATUSES: ReminderStatus[] = ['scheduled', 'sent', 'dismissed'];

export interface Reminder {
  id: number;
  vehicleId: number;
  /** What the reminder is about. */
  kind: 'mot_due' | 'service_due' | 'recall';
  /** The day the thing it is about falls due. */
  dueOn: string;
  /** What to say to the customer. */
  note: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRow {
  id: number;
  vehicle_id: number;
  kind: 'mot_due' | 'service_due' | 'recall';
  due_on: string;
  note: string;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;
}

export interface ReminderDraft {
  kind: 'mot_due' | 'service_due' | 'recall';
  dueOn: string;
  note: string;
}

export interface NewReminder extends ReminderDraft {
  vehicleId: number;
}
