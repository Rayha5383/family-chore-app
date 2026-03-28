import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { AppState, Chore, ProofSubmission } from '../types';
import { loadState, saveState } from '../lib/storage';
import { SEED_USERS, SEED_CHORES } from '../lib/constants';
import { runInstanceEngine } from '../engine/instanceEngine';
import { todayISO, currentMonth } from '../lib/utils';

function buildInitialState(): AppState {
  const now = new Date().toISOString();
  const chores = SEED_CHORES.map(c => ({ ...c, id: uuid(), created_at: now }));
  return {
    users: SEED_USERS,
    chores,
    instances: [],
    proofs: [],
    ledger: [],
    notes: [],
    lastEngineRun: '',
  };
}

interface StoreContextType {
  state: AppState;
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
}

const StoreContext = createContext<StoreContextType | null>(null);

export function ChoreStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadState();
    if (saved) {
      // Merge saved users with seed defaults, preserving names/avatars
      const mergedUsers = SEED_USERS.map(seedUser => {
        const savedUser = saved.users?.find((u: any) => u.id === seedUser.id);
        return savedUser ? { ...seedUser, ...savedUser } : seedUser;
      });
      return { ...saved, users: mergedUsers };
    }
    return buildInitialState();
  });

  useEffect(() => {
    const today = todayISO();
    if (state.lastEngineRun !== today) {
      setState(prev => runInstanceEngine(prev, today));
    }
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addChore = useCallback((chore: Omit<Chore, 'id' | 'created_at'>) => {
    setState(prev => ({
      ...prev,
      chores: [...prev.chores, { ...chore, id: uuid(), created_at: new Date().toISOString() }],
    }));
  }, []);

  const updateChore = useCallback((id: string, updates: Partial<Chore>) => {
    setState(prev => ({
      ...prev,
      chores: prev.chores.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  const deactivateChore = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      chores: prev.chores.map(c => c.id === id ? { ...c, active: false } : c),
    }));
  }, []);

  const submitProof = useCallback((instanceId: string, proof: Omit<ProofSubmission, 'id'>) => {
    const proofObj: ProofSubmission = { ...proof, id: uuid() };
    setState(prev => ({
      ...prev,
      instances: prev.instances.map(i =>
        i.id === instanceId ? { ...i, status: 'submitted', submitted_at: new Date().toISOString() } : i
      ),
      proofs: [...prev.proofs, proofObj],
    }));
  }, []);

  const submitAnytimeChore = useCallback((choreId: string, proof: Omit<ProofSubmission, 'id' | 'chore_instance_id'>) => {
    const now = new Date().toISOString();
    const today = todayISO();
    const instanceId = uuid();
    const proofObj: ProofSubmission = { ...proof, id: uuid(), chore_instance_id: instanceId };

    setState(prev => {
      const ch = prev.chores.find(c => c.id === choreId);
      if (!ch) return prev;
      const newInstance = {
        id: instanceId,
        chore_id: choreId,
        assigned_user_id: ch.assigned_user_id,
        due_date: today,
        status: 'submitted' as const,
        submitted_at: now,
        created_at: now,
      };
      return {
        ...prev,
        instances: [...prev.instances, newInstance],
        proofs: [...prev.proofs, proofObj],
      };
    });
  }, []);

  const approveInstance = useCallback((instanceId: string, payoutAmount: number, note?: string) => {
    const now = new Date().toISOString();
    setState(prev => {
      const instance = prev.instances.find(i => i.id === instanceId);
      if (!instance) return prev;
      const month = currentMonth();
      const earned = prev.ledger
        .filter(e => e.user_id === instance.assigned_user_id && e.month === month && e.status !== 'paid')
        .reduce((sum, e) => sum + e.amount, 0);
      const user = prev.users.find(u => u.id === instance.assigned_user_id);
      const cap = user?.monthly_cap ?? 100;
      const actualPayout = Math.min(payoutAmount, Math.max(0, cap - earned));
      const newLedger = actualPayout > 0 ? [{
        id: uuid(),
        user_id: instance.assigned_user_id,
        chore_instance_id: instanceId,
        amount: actualPayout,
        status: 'approved' as const,
        month,
        created_at: now,
      }] : [];
      const newNotes = note ? [{
        id: uuid(),
        chore_instance_id: instanceId,
        note,
        created_by: 'user-parent',
        created_at: now,
      }] : [];
      return {
        ...prev,
        instances: prev.instances.map(i =>
          i.id === instanceId ? { ...i, status: 'approved', approved_at: now, approved_by: 'user-parent', payout_amount: actualPayout } : i
        ),
        ledger: [...prev.ledger, ...newLedger],
        notes: [...prev.notes, ...newNotes],
      };
    });
  }, []);

  const rejectInstance = useCallback((instanceId: string, note: string) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      instances: prev.instances.map(i =>
        i.id === instanceId ? { ...i, status: 'rejected', approved_at: now, approved_by: 'user-parent' } : i
      ),
      notes: [...prev.notes, {
        id: uuid(),
        chore_instance_id: instanceId,
        note,
        created_by: 'user-parent',
        created_at: now,
      }],
    }));
  }, []);

  const processPayout = useCallback((userId: string, month: string) => {
    setState(prev => ({
      ...prev,
      ledger: prev.ledger.map(e =>
        e.user_id === userId && e.month === month && e.status === 'approved'
          ? { ...e, status: 'paid' }
          : e
      ),
    }));
  }, []);

  const updateUserProfile = useCallback((userId: string, name: string, avatarEmoji: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, name, avatar_emoji: avatarEmoji } : u),
    }));
  }, []);

  const runEngine = useCallback(() => {
    setState(prev => runInstanceEngine(prev, todayISO()));
  }, []);

  const resetApp = useCallback(() => {
    const fresh = buildInitialState();
    const withInstances = runInstanceEngine(fresh, todayISO());
    setState(withInstances);
  }, []);

  return (
    <StoreContext.Provider value={{ state, addChore, updateChore, deactivateChore, submitProof, submitAnytimeChore, approveInstance, rejectInstance, processPayout, updateUserProfile, runEngine, resetApp }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within ChoreStoreProvider');
  return ctx;
}
