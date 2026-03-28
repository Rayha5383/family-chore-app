import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChoreStoreProvider, useStore } from './store/ChoreStoreContext';
import { useSession } from './hooks/useSession';
import { SessionContext } from './context/SessionContext';
import { AppShell } from './components/layout/AppShell';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ChoreCreator } from './pages/parent/ChoreCreator';
import { SubmissionReview } from './pages/parent/SubmissionReview';
import { EarningsSummary } from './pages/parent/EarningsSummary';
import { MonthlyPayout } from './pages/parent/MonthlyPayout';
import { TodaysChores } from './pages/kid/TodaysChores';
import { EarningsTracker } from './pages/kid/EarningsTracker';
import { History } from './pages/kid/History';
import { SEED_USERS } from './lib/constants';

function AppRoutes() {
  const { state } = useStore();
  const { currentUserId, switchUser } = useSession();

  // Always resolve against live state.users so name/emoji updates are reflected immediately
  const currentUser =
    state.users.find(u => u.id === currentUserId) ||
    SEED_USERS.find(u => u.id === currentUserId) ||
    state.users[0];

  const isParent = currentUser.role === 'parent';

  return (
    <SessionContext.Provider value={{ currentUser, switchUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="parent" element={<ParentDashboard />} />
            <Route path="parent/chores" element={<ChoreCreator />} />
            <Route path="parent/review" element={<SubmissionReview />} />
            <Route path="parent/earnings" element={<EarningsSummary />} />
            <Route path="parent/payout" element={<MonthlyPayout />} />
            <Route path="kid" element={<TodaysChores />} />
            <Route path="kid/earnings" element={<EarningsTracker />} />
            <Route path="kid/history" element={<History />} />
            <Route index element={<Navigate to={isParent ? '/parent' : '/kid'} replace />} />
            <Route path="*" element={<Navigate to={isParent ? '/parent' : '/kid'} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionContext.Provider>
  );
}

export default function App() {
  return (
    <ChoreStoreProvider>
      <AppRoutes />
    </ChoreStoreProvider>
  );
}
