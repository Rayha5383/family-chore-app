import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../../context/AuthContext';
import { useStore, createTempClient } from '../../store/ChoreStoreContext';
import { Modal } from '../../components/ui/Modal';
import { KID_AVATARS, SEED_CHORES } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
}

export function AddChildModal({ onClose }: Props) {
  const { profile } = useAuth();
  const { refresh } = useStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [monthlyCap, setMonthlyCap] = useState('100');
  const [password, setPassword] = useState('');
  const [seedChores, setSeedChores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ email: string; password: string } | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !password || !profile) return;
    setLoading(true);
    setError('');

    const slug = name.trim().toLowerCase().replace(/\s+/g, '');
    const generatedEmail = `${slug}.${uuid().slice(0, 8)}@kids.choretracker.app`;

    // Use a temporary client so we don't sign out the parent
    const tempClient = createTempClient();

    const { data, error: signUpError } = await tempClient.auth.signUp({
      email: generatedEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          avatar_emoji: avatar,
          avatar_color: 'bg-indigo-500',
          role: 'child',
          monthly_cap: parseFloat(monthlyCap) || 100,
          parent_id: profile.id,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Seed default chores if requested
    if (seedChores && data.user) {
      const childId = data.user.id;
      const now = new Date().toISOString();
      // Use kid1 chores as template (filter out kid2 duplicates)
      const templateChores = SEED_CHORES.filter(c => c.assigned_user_id === 'user-kid1');
      const choresToInsert = templateChores.map(({ assigned_user_id: _, ...rest }) => ({
        id: uuid(),
        ...rest,
        assigned_user_id: childId,
        created_at: now,
      }));
      await supabase.from('chores').insert(choresToInsert);
    }

    await refresh();
    setDone({ email: generatedEmail, password });
    setLoading(false);
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title="Child Account Created">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-5xl mb-3">{avatar}</div>
            <p className="text-lg font-bold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">Account created successfully!</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Login Credentials</p>
            <div>
              <p className="text-xs text-gray-500">Email (username)</p>
              <p className="text-sm font-mono font-medium text-gray-900 break-all">{done.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Password</p>
              <p className="text-sm font-mono font-medium text-gray-900">{done.password}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Share these credentials with your child so they can sign in.
          </p>
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Add a Child" size="lg">
      <div className="flex flex-col gap-4">
        <div>
          <label className="label">Child's Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Emma"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
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

        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              className="input-field"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={seedChores}
            onChange={e => setSeedChores(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <span className="text-sm text-gray-700">Add default chores for this child</span>
        </label>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || password.length < 6}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
