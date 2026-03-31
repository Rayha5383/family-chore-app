import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../store/ChoreStoreContext';
import { currentMonth } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AddChildModal } from './AddChildModal';
import { InviteCoParentModal } from './InviteCoParentModal';

export function ParentDashboard() {
  const { state, loading } = useStore();
  const [showAddChild, setShowAddChild] = useState(false);
  const [showInviteParent, setShowInviteParent] = useState(false);
  const [visibleCredentials, setVisibleCredentials] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of all chore activity</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInviteParent(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus size={16} /> Co-Parent
          </button>
          <button
            onClick={() => setShowAddChild(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={16} /> Add Child
          </button>
        </div>
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

      {children.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="text-5xl mb-3">👨‍👧</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No children yet</h2>
          <p className="text-gray-400 text-sm mb-4">Add your kids so they can start earning</p>
          <button onClick={() => setShowAddChild(true)} className="btn-primary">
            Add a Child
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {childStats.map(({ child, earned, pending, overdue }) => (
            <div key={child.id} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{child.avatar_emoji}</div>
                <div className="flex-1 min-w-0">
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

              {child.login_email && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setVisibleCredentials(visibleCredentials === child.id ? null : child.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {visibleCredentials === child.id ? <EyeOff size={12} /> : <Eye size={12} />}
                    {visibleCredentials === child.id ? 'Hide' : 'Show'} login
                  </button>
                  {visibleCredentials === child.id && (
                    <p className="text-xs font-mono text-gray-600 mt-1 break-all">{child.login_email}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddChild && <AddChildModal onClose={() => setShowAddChild(false)} />}
      {showInviteParent && <InviteCoParentModal onClose={() => setShowInviteParent(false)} />}
    </div>
  );
}
