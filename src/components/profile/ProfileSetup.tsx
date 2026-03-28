import { useState } from 'react';
import { useStore } from '../../store/ChoreStoreContext';
import { useSessionContext } from '../../context/SessionContext';
import { KID_AVATARS } from '../../lib/constants';

export function ProfileSetup() {
  const { updateUserProfile } = useStore();
  const { currentUser } = useSessionContext();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(currentUser.avatar_emoji || '🦁');

  const needsSetup = currentUser.role === 'child' &&
    (currentUser.name === 'Kid 1' || currentUser.name === 'Kid 2');

  if (!needsSetup) return null;

  const handleSave = () => {
    if (name.trim().length < 1) return;
    updateUserProfile(currentUser.id, name.trim(), emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="text-5xl mb-3">{emoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Hey there! 👋</h1>
        <p className="text-gray-500 text-sm mb-6">Let's set up your profile</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Your Name</label>
          <input
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-indigo-500 text-center font-medium"
            placeholder="Type your name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={20}
          />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2 text-left">Pick your avatar</p>
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

        <button
          onClick={handleSave}
          disabled={name.trim().length < 1}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-40 transition-all active:scale-95"
        >
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}
