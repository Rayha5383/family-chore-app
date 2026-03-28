import { v4 as uuid } from 'uuid';
import { parseISO, isBefore, startOfDay } from 'date-fns';
import type { AppState, ChoreInstance } from '../types';

export function runInstanceEngine(state: AppState, today: string): AppState {
  const todayDate = startOfDay(parseISO(today));
  const todayDayOfWeek = todayDate.getDay();

  const existingKey = new Set(
    state.instances.map(i => `${i.chore_id}:${i.due_date}`)
  );

  const newInstances: ChoreInstance[] = [];

  for (const chore of state.chores) {
    if (!chore.active) continue;
    if (chore.frequency === 'anytime') continue; // anytime chores are manually triggered

    if (chore.frequency === 'daily') {
      const key = `${chore.id}:${today}`;
      if (!existingKey.has(key)) {
        newInstances.push({
          id: uuid(),
          chore_id: chore.id,
          assigned_user_id: chore.assigned_user_id,
          due_date: today,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        existingKey.add(key);
      }
    } else if (chore.frequency === 'weekly') {
      const days = chore.week_days.length > 0 ? chore.week_days : [0];
      if (days.includes(todayDayOfWeek as any)) {
        const key = `${chore.id}:${today}`;
        if (!existingKey.has(key)) {
          newInstances.push({
            id: uuid(),
            chore_id: chore.id,
            assigned_user_id: chore.assigned_user_id,
            due_date: today,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
          existingKey.add(key);
        }
      }
    }
  }

  const updatedInstances = state.instances.map(inst => {
    if (inst.status === 'pending') {
      const instDate = startOfDay(parseISO(inst.due_date));
      if (isBefore(instDate, todayDate)) {
        return { ...inst, status: 'overdue' as const };
      }
    }
    return inst;
  });

  return {
    ...state,
    instances: [...updatedInstances, ...newInstances],
    lastEngineRun: today,
  };
}
