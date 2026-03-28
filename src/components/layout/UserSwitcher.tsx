import { useSessionContext } from '../../context/SessionContext';
import { SEED_USERS } from '../../lib/constants';
import { useStore } from '../../store/ChoreStoreContext';

export function UserSwitcher() {
  const { currentUser, switchUser } = useSessionContext();
  const { state } = useStore();

  // Use live user data (with updated names/emojis)
  const liveUsers = SEED_USERS.map(su => state.users.find(u => u.id === su.id) || su);

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {liveUsers.map(user => (
        <button
          key={user.id}
          onClick={() => switchUser(user.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            currentUser.id === user.id
              ? `${user.avatar_color} text-white shadow-sm`
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="text-base leading-none">{user.avatar_emoji}</span>
          <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}
