import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store/ChoreStoreContext';
import { Modal } from '../../components/ui/Modal';
import { KID_AVATARS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
}

export function AddChildModal({ onClose }: Props) {
  const { profile } = useAuth();
  const { refresh } = useStore();
  const [childEmail, setChildEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [monthlyCap, setMonthlyCap] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleInvite = async () => {
    if (!childEmail.trim() || !childName.trim() || !profile) return;
    setLoading(true);
    setError('');

    const res = await supabase.functions.invoke('invite-child', {
      body: {
        childEmail: childEmail.trim(),
        childName: childName.trim(),
        avatarEmoji: avatar,
        monthlyCap: parseFloat(monthlyCap) || 100,
        redirectTo: window.location.origin,
      },
    });

    if (res.error || res.data?.error) {
      setError(res.data?.error || res.error?.message || 'Something went wrong');
      setLoading(false);
      return;
    }

    await refresh();
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title="Invite Sent!">
        <div className="flex flex-col gap-4 text-center">
          <div className="text-5xl mb-1">{avatar}</div>
          <p className="text-lg font-bold text-gray-900">{childName}</p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-sm text-indigo-800">
              An invite email has been sent to <strong>{childEmail}</strong>.
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              They'll click the link, set their own password, and land in the app as a child on your account.
            </p>
          </div>
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Invite a Child" size="lg">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">Child's Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Emma"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Child's Email *</label>
          <input
            type="email"
            className="input-field"
            placeholder="emma@gmail.com"
            value={childEmail}
            onChange={e => setChildEmail(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">They'll get an email with a link to set their own password.</p>
        </div>

        <div>
          <label className="label">Pick an Avatar</label>
          <div className="grid grid-cols-6 gap-2 mt-1">
            {KID_AVATARS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`text-2xl p-1.5 rounded-xl transition-all ${avatar === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Monthly Cap ($)</label>
          <input
            type="number"
            className="input-field"
            value={monthlyCap}
            onChange={e => setMonthlyCap(e.target.value)}
            min="0"
            step="10"
          />
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleInvite}
            disabled={loading || !childName.trim() || !childEmail.trim()}
            className="btn-primary flex-1"
          >
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
