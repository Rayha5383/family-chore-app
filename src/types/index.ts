export type Role = 'parent' | 'child';
export type Frequency = 'daily' | 'weekly' | 'anytime';
export type VerificationType = 'photo' | 'checklist' | 'both' | 'parent_only';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type InstanceStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'overdue';
export type LedgerStatus = 'pending' | 'approved' | 'paid';

export interface User {
  id: string;
  name: string;
  role: Role;
  monthly_cap: number;
  avatar_color: string;
  avatar_emoji: string;
  parent_id?: string;
  login_email?: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assigned_user_id: string;
  frequency: Frequency;
  value: number;
  due_time: string;
  verification_type: VerificationType;
  checklist_items: string[];
  requires_before_after: boolean;
  active: boolean;
  week_days: WeekDay[];
  created_at: string;
}

export interface ChoreInstance {
  id: string;
  chore_id: string;
  assigned_user_id: string;
  due_date: string;
  status: InstanceStatus;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  payout_amount?: number;
  paid_at?: string;
  created_at: string;
}

export interface ProofSubmission {
  id: string;
  chore_instance_id: string;
  photo_url?: string;
  before_photo_url?: string;
  checklist_answers: Record<string, boolean>;
  timestamp: string;
}

export interface EarningsLedger {
  id: string;
  user_id: string;
  chore_instance_id: string;
  amount: number;
  status: LedgerStatus;
  month: string;
  created_at: string;
}

export interface ParentNote {
  id: string;
  chore_instance_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export interface AppState {
  users: User[];
  chores: Chore[];
  instances: ChoreInstance[];
  proofs: ProofSubmission[];
  ledger: EarningsLedger[];
  notes: ParentNote[];
  lastEngineRun: string;
}
