import { useStore } from '../../store/ChoreStoreContext';
import { useSessionContext } from '../../context/SessionContext';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatCurrency } from '../../lib/utils';

export function History() {
  const { state } = useStore();
  const { currentUser } = useSessionContext();

  const history = state.instances
    .filter(i => i.assigned_user_id === currentUser.id && i.status !== 'pending')
    .sort((a, b) => b.due_date.localeCompare(a.due_date));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 text-sm">{history.length} completed chores</p>
      </div>

      {history.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No history yet. Complete some chores!</p>
        </div>
      )}

      {history.map(instance => {
        const chore = state.chores.find(c => c.id === instance.chore_id);
        const note = state.notes.find(n => n.chore_instance_id === instance.id);
        const ledger = state.ledger.find(e => e.chore_instance_id === instance.id);
        if (!chore) return null;
        return (
          <div key={instance.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{chore.title}</p>
                <p className="text-xs text-gray-500">{formatDate(instance.due_date)}</p>
              </div>
              <div className="flex items-center gap-2">
                {ledger && <span className="text-sm font-medium text-emerald-600">{formatCurrency(ledger.amount)}</span>}
                <Badge status={instance.status} />
              </div>
            </div>
            {note && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                <strong>Parent note:</strong> {note.note}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
