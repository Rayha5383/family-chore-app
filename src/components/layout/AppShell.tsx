import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSessionContext } from '../../context/SessionContext';
import { UserSwitcher } from './UserSwitcher';
import { EditProfileModal } from '../profile/EditProfileModal';
import {
  LayoutDashboard, ListChecks, CheckCircle, DollarSign, Calendar,
  ClipboardList, Star, History, Menu, X, Pencil
} from 'lucide-react';

const parentNav = [
  { to: '/parent', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/parent/chores', icon: ListChecks, label: 'Manage Chores' },
  { to: '/parent/review', icon: CheckCircle, label: 'Review Submissions' },
  { to: '/parent/earnings', icon: DollarSign, label: 'Earnings' },
  { to: '/parent/payout', icon: Calendar, label: 'Monthly Payout' },
];

const kidNav = [
  { to: '/kid', icon: ClipboardList, label: "Today's Chores", end: true },
  { to: '/kid/earnings', icon: Star, label: 'My Earnings' },
  { to: '/kid/history', icon: History, label: 'History' },
];

export function AppShell() {
  const { currentUser } = useSessionContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const nav = currentUser.role === 'parent' ? parentNav : kidNav;

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{currentUser.avatar_emoji || currentUser.name[0]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
          <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
        </div>
        {currentUser.role === 'child' && (
          <button
            onClick={() => setEditingProfile(true)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">ChoreTracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">Family Chore Manager</p>
        </div>
        <div className="p-4 border-b border-gray-100">
          <UserSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserFooter />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentUser.avatar_emoji || '⭐'}</span>
          <h1 className="text-lg font-bold text-gray-900">{currentUser.name}</h1>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h1 className="font-bold text-gray-900">ChoreTracker</h1>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <UserSwitcher />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks />
            </div>
            <UserFooter />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {editingProfile && currentUser.role === 'child' && (
        <EditProfileModal user={currentUser} onClose={() => setEditingProfile(false)} />
      )}
    </div>
  );
}
