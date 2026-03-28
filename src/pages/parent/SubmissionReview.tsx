import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/ChoreStoreContext';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime, formatCurrency } from '../../lib/utils';

export function SubmissionReview() {
  const { state, approveInstance, rejectInstance } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const submitted = state.instances
    .filter(i => i.status === 'submitted')
    .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''));

  const getChore = (id: string) => state.chores.find(c => c.id === id);
  const getUser = (id: string) => state.users.find(u => u.id === id);
  const getProof = (instanceId: string) => state.proofs.find(p => p.chore_instance_id === instanceId);

  if (submitted.length === 0) {
    return (
      <div className="text-center py-16">
        <Check size={48} className="text-emerald-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">All caught up!</h2>
        <p className="text-gray-400 text-sm mt-1">No submissions waiting for review</p>
      </div>
    );
  }

  const handleApprove = (instanceId: string, choreValue: number) => {
    const amount = parseFloat(approveAmount) || choreValue;
    approveInstance(instanceId, amount, approveNote || undefined);
    setSelected(null);
    setApproveAmount('');
    setApproveNote('');
  };

  const handleReject = (instanceId: string) => {
    rejectInstance(instanceId, rejectNote);
    setSelected(null);
    setRejectNote('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Submissions</h1>
        <p className="text-gray-500 text-sm">{submitted.length} waiting</p>
      </div>

      {submitted.map(instance => {
        const chore = getChore(instance.chore_id);
        const user = getUser(instance.assigned_user_id);
        const proof = getProof(instance.id);
        if (!chore || !user) return null;

        return (
          <div key={instance.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${user.avatar_color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {user.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{chore.title}</p>
                  <p className="text-xs text-gray-500">{user.name} &bull; {formatDateTime(instance.submitted_at || '')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{formatCurrency(chore.value)}</span>
                <button onClick={() => setExpanded(expanded === instance.id ? null : instance.id)} className="p-1 text-gray-400 hover:text-gray-600">
                  {expanded === instance.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {expanded === instance.id && (
              <div className="mt-4 flex flex-col gap-3">
                {proof?.before_photo_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Before</p>
                    <img src={proof.before_photo_url} className="w-full rounded-lg max-h-64 object-cover" alt="Before" />
                  </div>
                )}
                {proof?.photo_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{proof.before_photo_url ? 'After' : 'Proof Photo'}</p>
                    <img src={proof.photo_url} className="w-full rounded-lg max-h-64 object-cover" alt="Proof" />
                  </div>
                )}
                {proof && Object.keys(proof.checklist_answers).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Checklist</p>
                    {Object.entries(proof.checklist_answers).map(([item, checked]) => (
                      <div key={item} className="flex items-center gap-2 text-sm py-0.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                          {checked && <Check size={10} className="text-white" />}
                        </div>
                        <span className={checked ? 'text-gray-700' : 'text-gray-400'}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setSelected(`reject-${instance.id}`)} className="btn-danger flex-1 flex items-center justify-center gap-2">
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => { setApproveAmount(chore.value.toFixed(2)); setSelected(`approve-${instance.id}`); }} className="btn-success flex-1 flex items-center justify-center gap-2">
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>
            )}

            {!expanded && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelected(`reject-${instance.id}`)} className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm py-1.5">
                  <X size={14} /> Reject
                </button>
                <button onClick={() => { setApproveAmount(chore.value.toFixed(2)); setSelected(`approve-${instance.id}`); }} className="btn-success flex-1 flex items-center justify-center gap-2 text-sm py-1.5">
                  <Check size={14} /> Approve
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Approve modal */}
      {selected?.startsWith('approve-') && (() => {
        const instanceId = selected.replace('approve-', '');
        const instance = submitted.find(i => i.id === instanceId);
        const chore = instance ? getChore(instance.chore_id) : null;
        return (
          <Modal open title="Approve Submission" onClose={() => setSelected(null)}>
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Payout Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={chore?.value}
                    value={approveAmount}
                    onChange={e => setApproveAmount(e.target.value)}
                    className="input-field pl-7"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Full amount: {formatCurrency(chore?.value || 0)}</p>
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <textarea
                  value={approveNote}
                  onChange={e => setApproveNote(e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Great job! ..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleApprove(instanceId, chore?.value || 0)} className="btn-success flex-1">Approve</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Reject modal */}
      {selected?.startsWith('reject-') && (() => {
        const instanceId = selected.replace('reject-', '');
        return (
          <Modal open title="Reject Submission" onClose={() => setSelected(null)}>
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Reason for rejection</label>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Bed not fully made, please try again..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleReject(instanceId)} disabled={!rejectNote.trim()} className="btn-danger flex-1">Reject</button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
