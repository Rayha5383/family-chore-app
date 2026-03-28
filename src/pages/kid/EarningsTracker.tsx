import { useStore } from '../../store/ChoreStoreContext';
import { useSessionContext } from '../../context/SessionContext';
import { formatCurrency, currentMonth } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

export function EarningsTracker() {
  const { state } = useStore();
  const { currentUser } = useSessionContext();
  const month = currentMonth();

  const monthLedger = state.ledger.filter(e => e.user_id === currentUser.id && e.month === month);
  const approved = monthLedger.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const paid = monthLedger.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const total = approved + paid;
  const cap = currentUser.monthly_cap;

  const myChores = state.chores.filter(c => c.assigned_user_id === currentUser.id && c.active && c.frequency !== 'anytime');
  const streaks = myChores.map(chore => {
    const approvedInstances = state.instances
      .filter(i => i.chore_id === chore.id && i.status === 'approved')
      .sort((a, b) => b.due_date.localeCompare(a.due_date));
    return { chore, streak: approvedInstances.length };
  }).filter(s => s.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{currentUser.avatar_emoji || '⭐'}</div>
          <div>
            <p className="text-indigo-200 text-sm">{month}</p>
            <p className="text-4xl font-black">{formatCurrency(total)}</p>
            <p className="text-indigo-200 text-sm">of {formatCurrency(cap)} monthly cap</p>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, cap > 0 ? (total / cap) * 100 : 0)}%` }}
          />
        </div>
        {total >= cap && (
          <p className="text-yellow-300 text-sm font-bold mt-2 text-center">🎉 Monthly cap reached!</p>
        )}
      </div>

      {streaks.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3">🔥 Streaks</h2>
          <div className="flex flex-col gap-2">
            {streaks.map(({ chore, streak }) => (
              <div key={chore.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{chore.title}</span>
                <span className="text-sm font-bold text-amber-600">🔥 {streak}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthLedger.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3">This Month's Earnings</h2>
          <div className="flex flex-col gap-2">
            {monthLedger.map(entry => {
              const instance = state.instances.find(i => i.id === entry.chore_instance_id);
              const chore = instance ? state.chores.find(c => c.id === instance.chore_id) : null;
              return (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{chore?.title || 'Chore'}</span>
                  <div className="flex items-center gap-2">
                    <Badge status={entry.status} />
                    <span className="font-medium">{formatCurrency(entry.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
