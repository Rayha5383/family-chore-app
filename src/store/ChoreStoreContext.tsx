import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { AppState, Chore, ChoreInstance, EarningsLedger, ParentNote, ProofSubmission, User } from '../types';
import { todayISO } from '../lib/utils';
import { parseISO, isBefore, startOfDay } from 'date-fns';

// ─── DB → App mappers ────────────────────────────────────────────────────────

function mapProfile(row: any): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    monthly_cap: Number(row.monthly_cap) || 0,
    avatar_color: row.avatar_color || 'bg-indigo-500',
    avatar_emoji: row.avatar_emoji || '🦁',
    parent_id: row.parent_id || undefined,
    login_email: row.login_email || undefined,
  };
}

function mapChore(row: any): Chore {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    assigned_user_id: row.assigned_user_id,
    frequency: row.frequency,
    value: Number(row.value) || 0,
    due_time: row.due_time || '20:00',
    verification_type: row.verification_type || 'photo',
    checklist_items: row.checklist_items || [],
    requires_before_after: row.requires_before_after || false,
    active: row.active,
    week_days: row.week_days || [],
    created_at: row.created_at,
  };
}

function mapInstance(row: any): ChoreInstance {
  return {
    id: row.id,
    chore_id: row.chore_id,
    assigned_user_id: row.assigned_user_id,
    due_date: row.due_date,
    status: row.status,
    submitted_at: row.submitted_at || undefined,
    approved_at: row.approved_at || undefined,
    approved_by: row.approved_at ? 'parent' : undefined,
    payout_amount: row.approved_amount ? Number(row.approved_amount) : undefined,
    paid_at: row.paid_at || undefined,
    created_at: row.created_at,
  };
}

function mapProof(row: any): ProofSubmission {
  const checklist_answers: Record<string, boolean> = {};
  (row.checklist_done || []).forEach((item: string) => {
    checklist_answers[item] = true;
  });
  return {
    id: row.id,
    chore_instance_id: row.instance_id,
    photo_url: row.photo_after || undefined,
    before_photo_url: row.photo_before || undefined,
    checklist_answers,
    timestamp: row.submitted_at || new Date().toISOString(),
  };
}

// ─── Derived state ────────────────────────────────────────────────────────────

function deriveLedger(instances: ChoreInstance[]): EarningsLedger[] {
  return instances
    .filter(i => i.status === 'approved' && i.payout_amount && i.payout_amount > 0)
    .map(i => ({
      id: i.id,
      user_id: i.assigned_user_id,
      chore_instance_id: i.id,
      amount: i.payout_amount!,
      status: i.paid_at ? 'paid' as const : 'approved' as const,
      month: i.due_date.slice(0, 7),
      created_at: i.approved_at || i.created_at,
    }));
}

function deriveNotes(rawProofs: any[]): ParentNote[] {
  return rawProofs
    .filter(p => p.reviewer_note)
    .map(p => ({
      id: `note-${p.id}`,
      chore_instance_id: p.instance_id,
      note: p.reviewer_note,
      created_by: 'parent',
      created_at: p.reviewed_at || p.submitted_at,
    }));
}

// ─── Instance engine ──────────────────────────────────────────────────────────

async function runEngine(chores: Chore[], instances: ChoreInstance[]) {
  const today = todayISO();
  const todayDate = startOfDay(parseISO(today));
  const todayDay = todayDate.getDay();
  const existingKeys = new Set(instances.map(i => `${i.chore_id}:${i.due_date}`));
  const toInsert: any[] = [];

  for (const chore of chores) {
    if (!chore.active || chore.frequency === 'anytime') continue;
    if (chore.frequency === 'daily') {
      const key = `${chore.id}:${today}`;
      if (!existingKeys.has(key)) {
        toInsert.push({ id: uuid(), chore_id: chore.id, assigned_user_id: chore.assigned_user_id, due_date: today, status: 'pending', created_at: new Date().toISOString() });
        existingKeys.add(key);
      }
    } else if (chore.frequency === 'weekly') {
      const days = chore.week_days.length > 0 ? chore.week_days : [0];
      if ((days as number[]).includes(todayDay)) {
        const key = `${chore.id}:${today}`;
        if (!existingKeys.has(key)) {
          toInsert.push({ id: uuid(), chore_id: chore.id, assigned_user_id: chore.assigned_user_id, due_date: today, status: 'pending', created_at: new Date().toISOString() });
          existingKeys.add(key);
        }
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('chore_instances').upsert(toInsert, { onConflict: 'chore_id,due_date', ignoreDuplicates: true });
  }

  const overdueIds = instances
    .filter(i => i.status === 'pending' && isBefore(startOfDay(parseISO(i.due_date)), todayDate))
    .map(i => i.id);

  if (overdueIds.length > 0) {
    await supabase.from('chore_instances').update({ status: 'overdue' }).in('id', overdueIds);
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const EMPTY_STATE: AppState = {
  users: [], chores: [], instances: [], proofs: [], ledger: [], notes: [], lastEngineRun: '',
};

interface StoreContextType {
  state: AppState;
  loading: boolean;
  addChore: (chore: Omit<Chore, 'id' | 'created_at'>) => void;
  updateChore: (id: string, updates: Partial<Chore>) => void;
  deactivateChore: (id: string) => void;
  submitProof: (instanceId: string, proof: Omit<ProofSubmission, 'id'>) => void;
  submitAnytimeChore: (choreId: string, proof: Omit<ProofSubmission, 'id' | 'chore_instance_id'>) => void;
  approveInstance: (instanceId: string, payoutAmount: number, note?: string) => void;
  rejectInstance: (instanceId: string, note: string) => void;
  processPayout: (userId: string, month: string) => void;
  updateUserProfile: (userId: string, name: string, avatarEmoji: string) => void;
  runEngine: () => void;
  resetApp: () => void;
  refresh: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function ChoreStoreProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile) { setLoading(false); return; }

    const selfUser = mapProfile(profile);
    let users: User[] = [selfUser];

    if (profile.role === 'parent') {
      // Primary parent: parent_id is null. Co-parent: parent_id points to primary parent.
      const familyParentId = profile.parent_id || profile.id;
      const { data: familyMembers } = await supabase.from('profiles').select('*').eq('parent_id', familyParentId);
      if (familyMembers) {
        const others = familyMembers.map(mapProfile).filter(u => u.id !== profile.id);
        users = [selfUser, ...others];
      }
    }

    const { data: rawChores } = await supabase.from('chores').select('*');
    const chores = (rawChores || []).map(mapChore);

    const { data: rawInstances } = await supabase
      .from('chore_instances').select('*').order('due_date', { ascending: false });
    const instances = (rawInstances || []).map(mapInstance);

    // Run engine to create today's instances and mark overdue
    await runEngine(chores, instances);

    // Reload instances after engine run
    const { data: rawInstances2 } = await supabase
      .from('chore_instances').select('*').order('due_date', { ascending: false });
    const instances2 = (rawInstances2 || []).map(mapInstance);

    const { data: rawProofs } = await supabase.from('proofs').select('*');
    const proofs = (rawProofs || []).map(mapProof);
    const ledger = deriveLedger(instances2);
    const notes = deriveNotes(rawProofs || []);

    setState({ users, chores, instances: instances2, proofs, ledger, notes, lastEngineRun: todayISO() });
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => { fetchAll(); }, [fetchAll]);

  const addChore = useCallback((chore: Omit<Chore, 'id' | 'created_at'>) => {
    supabase.from('chores').insert({ id: uuid(), ...chore, created_at: new Date().toISOString() })
      .then(() => fetchAll());
  }, [fetchAll]);

  const updateChore = useCallback((id: string, updates: Partial<Chore>) => {
    supabase.from('chores').update(updates).eq('id', id).then(() => fetchAll());
  }, [fetchAll]);

  const deactivateChore = useCallback((id: string) => {
    supabase.from('chores').update({ active: false }).eq('id', id).then(() => fetchAll());
  }, [fetchAll]);

  const submitProof = useCallback((instanceId: string, proof: Omit<ProofSubmission, 'id'>) => {
    if (!profile) return;
    const now = new Date().toISOString();
    const checklistDone = Object.entries(proof.checklist_answers).filter(([, v]) => v).map(([k]) => k);
    Promise.all([
      supabase.from('chore_instances').update({ status: 'submitted', submitted_at: now }).eq('id', instanceId),
      supabase.from('proofs').upsert({
        id: uuid(), instance_id: instanceId, user_id: profile.id,
        photo_after: proof.photo_url || null, photo_before: proof.before_photo_url || null,
        checklist_done: checklistDone, submitted_at: now,
      }, { onConflict: 'instance_id' }),
    ]).then(() => fetchAll());
  }, [fetchAll, profile]);

  const submitAnytimeChore = useCallback((choreId: string, proof: Omit<ProofSubmission, 'id' | 'chore_instance_id'>) => {
    if (!profile) return;
    const now = new Date().toISOString();
    const instanceId = uuid();
    const chore = state.chores.find(c => c.id === choreId);
    if (!chore) return;
    const checklistDone = Object.entries(proof.checklist_answers).filter(([, v]) => v).map(([k]) => k);
    supabase.from('chore_instances').insert({
      id: instanceId, chore_id: choreId, assigned_user_id: chore.assigned_user_id,
      due_date: todayISO(), status: 'submitted', submitted_at: now, created_at: now,
    }).then(() => supabase.from('proofs').insert({
      id: uuid(), instance_id: instanceId, user_id: profile.id,
      photo_after: proof.photo_url || null, photo_before: proof.before_photo_url || null,
      checklist_done: checklistDone, submitted_at: now,
    })).then(() => fetchAll());
  }, [fetchAll, profile, state.chores]);

  const approveInstance = useCallback((instanceId: string, payoutAmount: number, note?: string) => {
    const now = new Date().toISOString();
    const instance = state.instances.find(i => i.id === instanceId);
    if (!instance) return;
    const month = instance.due_date.slice(0, 7);
    const earned = state.ledger.filter(e => e.user_id === instance.assigned_user_id && e.month === month && e.status !== 'paid').reduce((s, e) => s + e.amount, 0);
    const user = state.users.find(u => u.id === instance.assigned_user_id);
    const cap = user?.monthly_cap ?? 100;
    const actualPayout = Math.min(payoutAmount, Math.max(0, cap - earned));
    supabase.from('chore_instances').update({ status: 'approved', approved_amount: actualPayout, approved_at: now }).eq('id', instanceId)
      .then(() => note ? supabase.from('proofs').update({ reviewer_note: note, reviewed_at: now }).eq('instance_id', instanceId) : null)
      .then(() => fetchAll());
  }, [fetchAll, state]);

  const rejectInstance = useCallback((instanceId: string, note: string) => {
    const now = new Date().toISOString();
    supabase.from('chore_instances').update({ status: 'rejected', approved_at: now }).eq('id', instanceId)
      .then(() => supabase.from('proofs').update({ reviewer_note: note, reviewed_at: now }).eq('instance_id', instanceId))
      .then(() => fetchAll());
  }, [fetchAll]);

  const processPayout = useCallback((userId: string, month: string) => {
    const monthStart = `${month}-01`;
    const next = new Date(`${month}-01`);
    next.setMonth(next.getMonth() + 1);
    const monthEnd = next.toISOString().slice(0, 10);
    supabase.from('chore_instances')
      .update({ paid_at: new Date().toISOString() })
      .eq('assigned_user_id', userId).eq('status', 'approved').is('paid_at', null)
      .gte('due_date', monthStart).lt('due_date', monthEnd)
      .then(() => fetchAll());
  }, [fetchAll]);

  const updateUserProfile = useCallback((userId: string, name: string, avatarEmoji: string) => {
    supabase.from('profiles').update({ name, avatar_emoji: avatarEmoji }).eq('id', userId).then(() => fetchAll());
  }, [fetchAll]);

  const runEngineAction = useCallback(() => {
    runEngine(state.chores, state.instances).then(() => fetchAll());
  }, [fetchAll, state.chores, state.instances]);

  const resetApp = useCallback(() => { fetchAll(); }, [fetchAll]);

  return (
    <StoreContext.Provider value={{
      state, loading, addChore, updateChore, deactivateChore,
      submitProof, submitAnytimeChore, approveInstance, rejectInstance,
      processPayout, updateUserProfile, runEngine: runEngineAction, resetApp, refresh,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

// Temporary client for creating child accounts without affecting parent session
export function createTempClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'child-creation-temp' } }
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within ChoreStoreProvider');
  return ctx;
}
