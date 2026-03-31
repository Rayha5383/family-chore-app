import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
}

export function InviteCoParentModal({ onClose }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !name.trim()) return;
    setLoading(true);
    setError('');

    const res = await supabase.functions.invoke('invite-child', {
      body: {
        childEmail: email.trim(),
        childName: name.trim(),
        role: 'parent',
        redirectTo: window.location.origin,
      },
    });

    if (res.error || res.data?.error) {
      setError(res.data?.error || res.error?.message || 'Something went wrong');
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title="Invite Sent!">
        <div className="flex flex-col gap-4 text-center">
          <div className="text-5xl mb-1">👨‍👧</div>
          <p className="text-lg font-bold text-gray-900">{name}</p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-sm text-indigo-800">
              An invite has been sent to <strong>{email}</strong>.
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              Once they accept and set a password, they'll have full parent access to your family's chores.
            </p>
          </div>
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Invite a Co-Parent">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          They'll get full parent access — can review submissions, approve chores, and manage all kids.
        </p>
        <div>
          <label className="label">Their Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Mom or Dad"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="label">Their Email *</label>
          <input
            type="email"
            className="input-field"
            placeholder="partner@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleInvite}
            disabled={loading || !name.trim() || !email.trim()}
            className="btn-primary flex-1"
          >
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
