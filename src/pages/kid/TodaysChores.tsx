import { useState } from 'react';
import { useStore } from '../../store/ChoreStoreContext';
import { useSessionContext } from '../../context/SessionContext';
import { todayISO, formatCurrency } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { SubmissionForm } from '../../components/submissions/SubmissionForm';
import { ProfileSetup } from '../../components/profile/ProfileSetup';
import { Clock, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';
import type { ChoreInstance, Chore } from '../../types';

export function TodaysChores() {
  const { state, submitProof, submitAnytimeChore } = useStore();
  const { currentUser } = useSessionContext();
  const [submitting, setSubmitting] = useState<{ instance?: ChoreInstance; chore: Chore } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    daily: true, weekly: true, anytime: true
  });

  const today = todayISO();

  // Daily & weekly instances
  const todaysInstances = state.instances
    .filter(i => i.assigned_user_id === currentUser.id && i.due_date === today)
    .sort((a, b) => a.status.localeCompare(b.status));

  const getChore = (id: string) => state.chores.find(c => c.id === id);

  const dailyInstances = todaysInstances.filter(i => getChore(i.chore_id)?.frequency === 'daily');
  const weeklyInstances = todaysInstances.filter(i => getChore(i.chore_id)?.frequency === 'weekly');
  const anytimeChores = state.chores.filter(c => c.assigned_user_id === currentUser.id && c.active && c.frequency === 'anytime');

  const toggleSection = (key: string) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const monthEarned = (() => {
    const month = today.slice(0, 7);
    return state.ledger
      .filter(e => e.user_id === currentUser.id && e.month === month && e.status !== 'paid')
      .reduce((s, e) => s + e.amount, 0);
  })();

  const ChoreRow = ({ instance }: { instance: ChoreInstance }) => {
    const chore = getChore(instance.chore_id);
    if (!chore) return null;
    const canSubmit = instance.status === 'pending';
    const note = state.notes.find(n => n.chore_instance_id === instance.id);

    return (
      <div className={`rounded-xl border p-3 transition-all ${
        instance.status === 'approved' ? 'border-emerald-200 bg-emerald-50' :
        instance.status === 'submitted' ? 'border-yellow-200 bg-yellow-50' :
        instance.status === 'rejected' ? 'border-red-200 bg-red-50' :
        'border-gray-100 bg-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="text-xl">
            {instance.status === 'approved' ? '✅' :
             instance.status === 'submitted' ? '⏳' :
             instance.status === 'rejected' ? '❌' : '⬜'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm ${instance.status === 'approved' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {chore.title}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">{formatCurrency(chore.value)}</p>
          </div>
          {canSubmit && (
            <button
              onClick={() => setSubmitting({ instance, chore })}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Submit
            </button>
          )}
          {instance.status === 'submitted' && (
            <span className="text-xs text-yellow-600 font-medium">Reviewing…</span>
          )}
        </div>
        {instance.status === 'rejected' && note && (
          <div className="mt-2 ml-8 text-xs text-red-700 bg-red-50 rounded-lg p-2 border border-red-100">
            💬 {note.note}
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, icon, sectionKey, children, count, total }: {
    title: string; icon: React.ReactNode; sectionKey: string;
    children: React.ReactNode; count: number; total: number;
  }) => (
    <div className="card">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        {icon}
        <span className="font-bold text-gray-900 flex-1">{title}</span>
        <span className="text-xs text-gray-500">{count}/{total}</span>
        {expandedSections[sectionKey] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {expandedSections[sectionKey] && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );

  return (
    <>
      <ProfileSetup />
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="text-4xl">{currentUser.avatar_emoji || '⭐'}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentUser.name}'s Chores</h1>
            <p className="text-sm text-emerald-600 font-semibold">
              {formatCurrency(monthEarned)} earned this month
            </p>
          </div>
        </div>

        {/* Daily Habits */}
        {dailyInstances.length > 0 && (
          <Section
            title="Daily Habits"
            icon={<Clock size={18} className="text-indigo-500" />}
            sectionKey="daily"
            count={dailyInstances.filter(i => i.status === 'approved').length}
            total={dailyInstances.length}
          >
            {dailyInstances.map(i => <ChoreRow key={i.id} instance={i} />)}
          </Section>
        )}

        {/* Weekly Bonus */}
        {weeklyInstances.length > 0 && (
          <Section
            title="Weekly Bonus"
            icon={<Star size={18} className="text-amber-500" />}
            sectionKey="weekly"
            count={weeklyInstances.filter(i => i.status === 'approved').length}
            total={weeklyInstances.length}
          >
            {weeklyInstances.map(i => <ChoreRow key={i.id} instance={i} />)}
          </Section>
        )}

        {/* Anytime Bonus */}
        <div className="card">
          <button
            onClick={() => toggleSection('anytime')}
            className="flex items-center gap-2 w-full text-left mb-3"
          >
            <Zap size={18} className="text-purple-500" />
            <span className="font-bold text-gray-900 flex-1">Anytime Bonus</span>
            <span className="text-xs text-gray-500">earn whenever you do these</span>
            {expandedSections['anytime'] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {expandedSections['anytime'] && (
            <div className="flex flex-col gap-2">
              {anytimeChores.map(chore => (
                <div key={chore.id} className="flex items-center gap-3 p-3 rounded-xl border border-purple-100 bg-purple-50">
                  <div className="text-xl">⚡</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{chore.title}</p>
                    <p className="text-xs text-purple-600 font-semibold">{formatCurrency(chore.value)} each time</p>
                  </div>
                  <button
                    onClick={() => setSubmitting({ chore })}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    Do This!
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit modal */}
        <Modal open={!!submitting} onClose={() => setSubmitting(null)} title="Submit Chore" size="lg">
          {submitting && (
            <SubmissionForm
              chore={submitting.chore}
              childName={currentUser.name}
              instanceId={submitting.instance?.id || ''}
              isAnytime={!submitting.instance}
              onSubmit={(proof) => {
                if (submitting.instance) {
                  submitProof(submitting.instance.id, proof);
                } else {
                  submitAnytimeChore(submitting.chore.id, proof);
                }
                setSubmitting(null);
              }}
              onCancel={() => setSubmitting(null)}
            />
          )}
        </Modal>
      </div>
    </>
  );
}
