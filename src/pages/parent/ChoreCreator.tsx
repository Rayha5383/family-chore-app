import { useState } from 'react';
import { Plus, Edit2, PowerOff } from 'lucide-react';
import { useStore } from '../../store/ChoreStoreContext';
import { Modal } from '../../components/ui/Modal';
import { VERIFICATION_LABELS } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils';
import type { Chore, VerificationType, Frequency, WeekDay } from '../../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyForm = {
  title: '',
  description: '',
  assigned_user_id: 'user-kid1',
  frequency: 'daily' as Frequency,
  value: '',
  due_time: '20:00',
  verification_type: 'photo' as VerificationType,
  checklist_items_text: '',
  requires_before_after: false,
  week_days: [] as WeekDay[],
};

export function ChoreCreator() {
  const { state, addChore, updateChore, deactivateChore } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Chore | null>(null);
  const [form, setForm] = useState(emptyForm);

  const children = state.users.filter(u => u.role === 'child');
  const activeChores = state.chores.filter(c => c.active);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (chore: Chore) => {
    setEditing(chore);
    setForm({
      title: chore.title,
      description: chore.description,
      assigned_user_id: chore.assigned_user_id,
      frequency: chore.frequency,
      value: chore.value.toString(),
      due_time: chore.due_time,
      verification_type: chore.verification_type,
      checklist_items_text: chore.checklist_items.join('\n'),
      requires_before_after: chore.requires_before_after,
      week_days: chore.week_days,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.value) return;
    const chore = {
      title: form.title.trim(),
      description: form.description.trim(),
      assigned_user_id: form.assigned_user_id,
      frequency: form.frequency,
      value: parseFloat(form.value) || 0,
      due_time: form.due_time,
      verification_type: form.verification_type,
      checklist_items: form.checklist_items_text.split('\n').map(s => s.trim()).filter(Boolean),
      requires_before_after: form.requires_before_after,
      active: true,
      week_days: form.week_days,
    };
    if (editing) updateChore(editing.id, chore);
    else addChore(chore);
    setShowForm(false);
  };

  const toggleWeekDay = (day: WeekDay) => {
    setForm(prev => ({
      ...prev,
      week_days: prev.week_days.includes(day)
        ? prev.week_days.filter(d => d !== day)
        : [...prev.week_days, day],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Chores</h1>
          <p className="text-gray-500 text-sm">{activeChores.length} active chores</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Chore
        </button>
      </div>

      {activeChores.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No chores yet. Create one above!</p>
        </div>
      )}

      {activeChores.map(chore => {
        const user = state.users.find(u => u.id === chore.assigned_user_id);
        return (
          <div key={chore.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {user && (
                  <div className={`w-8 h-8 rounded-full ${user.avatar_color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{chore.title}</p>
                  <p className="text-xs text-gray-500">
                    {user?.name} &bull; {chore.frequency} &bull; {formatCurrency(chore.value)} &bull; {VERIFICATION_LABELS[chore.verification_type]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(chore)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deactivateChore(chore.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <PowerOff size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Chore' : 'New Chore'} size="lg">
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Chore Name *</label>
            <input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Make Bed" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field resize-none" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What needs to be done..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assigned To</label>
              <select className="input-field" value={form.assigned_user_id} onChange={e => setForm(p => ({ ...p, assigned_user_id: e.target.value }))}>
                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Value ($)</label>
              <input type="number" step="0.25" min="0" className="input-field" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0.50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Frequency</label>
              <select className="input-field" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value as Frequency }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="label">Due By</label>
              <input type="time" className="input-field" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))} />
            </div>
          </div>
          {form.frequency === 'weekly' && (
            <div>
              <label className="label">Which Days</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekDay(i as WeekDay)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      form.week_days.includes(i as WeekDay) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label">Verification Type</label>
            <select className="input-field" value={form.verification_type} onChange={e => setForm(p => ({ ...p, verification_type: e.target.value as VerificationType }))}>
              {Object.entries(VERIFICATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {(form.verification_type === 'photo' || form.verification_type === 'both') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.requires_before_after} onChange={e => setForm(p => ({ ...p, requires_before_after: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">Require before + after photos</span>
            </label>
          )}
          {(form.verification_type === 'checklist' || form.verification_type === 'both') && (
            <div>
              <label className="label">Checklist Items (one per line)</label>
              <textarea className="input-field resize-none font-mono text-sm" rows={4} value={form.checklist_items_text} onChange={e => setForm(p => ({ ...p, checklist_items_text: e.target.value }))} placeholder={"Sink wiped\nMirror cleaned\nToilet cleaned"} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={!form.title.trim() || !form.value} className="btn-primary flex-1">
              {editing ? 'Save Changes' : 'Create Chore'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
