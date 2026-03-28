import { useState } from 'react';
import { useStore } from '../../store/ChoreStoreContext';
import { KID_AVATARS } from '../../lib/constants';
import type { User } from '../../types';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
}

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const { updateUserProfile } = useStore();
  const [name, setName] = useState(user.name);
  const [emoji, setEmoji] = useState(user.avatar_emoji || '🦁');

  const handleSave = () => {
    if (name.trim().length < 1) return;
    updateUserProfile(user.id, name.trim(), emoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">{emoji}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Name</label>
          <input
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-indigo-500 text-center font-medium"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2 text-left">Avatar</p>
          <div className="grid grid-cols-6 gap-2">
            {KID_AVATARS.map(av => (
              <button
                key={av}
                onClick={() => setEmoji(av)}
                className={`text-2xl p-1.5 rounded-xl transition-all ${
                  emoji === av ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'hover:bg-gray-100'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={name.trim().length < 1} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  );
}
