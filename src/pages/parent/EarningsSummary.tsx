import { useStore } from '../../store/ChoreStoreContext';
import { formatCurrency, currentMonth } from '../../lib/utils';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';

export function EarningsSummary() {
  const { state } = useStore();
  const month = currentMonth();
  const children = state.users.filter(u => u.role === 'child');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings Summary</h1>
        <p className="text-gray-500 text-sm">Current month: {month}</p>
      </div>

      {children.map(child => {
        const monthLedger = state.ledger.filter(e => e.user_id === child.id && e.month === month);
        const approved = monthLedger.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
        const paid = monthLedger.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
        const total = approved + paid;

        return (
          <div key={child.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${child.avatar_color} flex items-center justify-center text-white font-bold`}>
                {child.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{child.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
                <p className="text-xs text-gray-500">of {formatCurrency(child.monthly_cap)} cap</p>
              </div>
            </div>
            <ProgressBar value={total} max={child.monthly_cap} />
            <div className="mt-3 flex gap-3 text-sm">
              <span className="text-gray-600">Pending payout: <strong>{formatCurrency(approved)}</strong></span>
              <span className="text-gray-600">Paid: <strong>{formatCurrency(paid)}</strong></span>
            </div>

            {monthLedger.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3 flex flex-col gap-2">
                {monthLedger.map(entry => {
                  const instance = state.instances.find(i => i.id === entry.chore_instance_id);
                  const chore = instance ? state.chores.find(c => c.id === instance.chore_id) : null;
                  return (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{chore?.title || 'Chore'}</span>
                      <div className="flex items-center gap-2">
                        <Badge status={entry.status} />
                        <span className="font-medium text-gray-900">{formatCurrency(entry.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
