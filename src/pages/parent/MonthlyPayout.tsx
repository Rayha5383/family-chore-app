import { useState } from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/ChoreStoreContext';
import { formatCurrency, currentMonth } from '../../lib/utils';

export function MonthlyPayout() {
  const { state, processPayout } = useStore();
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const month = currentMonth();
  const children = state.users.filter(u => u.role === 'child');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Payout</h1>
        <p className="text-gray-500 text-sm">{month}</p>
      </div>

      {children.map(child => {
        const pending = state.ledger
          .filter(e => e.user_id === child.id && e.month === month && e.status === 'approved')
          .reduce((s, e) => s + e.amount, 0);
        const alreadyPaid = state.ledger
          .filter(e => e.user_id === child.id && e.month === month && e.status === 'paid')
          .reduce((s, e) => s + e.amount, 0);

        return (
          <div key={child.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${child.avatar_color} flex items-center justify-center text-white font-bold`}>
                {child.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{child.name}</p>
                {alreadyPaid > 0 && <p className="text-xs text-emerald-600">Paid out: {formatCurrency(alreadyPaid)}</p>}
              </div>
            </div>

            {pending > 0 ? (
              confirmed === child.id ? (
                <div className="flex flex-col gap-3">
                  <p className="text-gray-700">Confirm payout of <strong>{formatCurrency(pending)}</strong> to {child.name}?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmed(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={() => { processPayout(child.id, month); setConfirmed(null); }} className="btn-success flex-1 flex items-center justify-center gap-2">
                      <DollarSign size={16} /> Confirm Pay {formatCurrency(pending)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-gray-700">Ready to pay: <strong className="text-emerald-600">{formatCurrency(pending)}</strong></p>
                  <button onClick={() => setConfirmed(child.id)} className="btn-success flex items-center gap-2">
                    <DollarSign size={16} /> Pay Out
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-sm">{alreadyPaid > 0 ? `${formatCurrency(alreadyPaid)} paid this month` : 'Nothing to pay out yet'}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
