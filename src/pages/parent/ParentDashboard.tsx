import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/ChoreStoreContext';
import { currentMonth } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';

export function ParentDashboard() {
  const { state } = useStore();

  const pendingReview = state.instances.filter(i => i.status === 'submitted');
  const month = currentMonth();
  const children = state.users.filter(u => u.role === 'child');

  const childStats = children.map(child => {
    const earned = state.ledger
      .filter(e => e.user_id === child.id && e.month === month && e.status !== 'paid')
      .reduce((sum, e) => sum + e.amount, 0);
    const pending = state.instances.filter(i => i.assigned_user_id === child.id && i.status === 'submitted').length;
    const overdue = state.instances.filter(i => i.assigned_user_id === child.id && i.status === 'overdue').length;
    return { child, earned, pending, overdue };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of all chore activity</p>
      </div>

      {pendingReview.length > 0 && (
        <Link to="/parent/review" className="block">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 hover:bg-yellow-100 transition-colors">
            <Clock size={20} className="text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">{pendingReview.length} submission{pendingReview.length !== 1 ? 's' : ''} waiting for review</p>
              <p className="text-xs text-yellow-700">Tap to review now</p>
            </div>
            <Badge status="submitted" />
          </div>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {childStats.map(({ child, earned, pending, overdue }) => (
          <div key={child.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${child.avatar_color} flex items-center justify-center text-white font-bold`}>
                {child.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
            <ProgressBar value={earned} max={child.monthly_cap} />
            <div className="flex gap-3 mt-3">
              {pending > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-700">
                  <Clock size={12} /> {pending} to review
                </div>
              )}
              {overdue > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-700">
                  <AlertTriangle size={12} /> {overdue} overdue
                </div>
              )}
              {pending === 0 && overdue === 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle size={12} /> All caught up
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
