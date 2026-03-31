import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChoreStoreProvider } from './store/ChoreStoreContext';
import { SessionContext } from './context/SessionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { SetPassword } from './pages/SetPassword';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ChoreCreator } from './pages/parent/ChoreCreator';
import { SubmissionReview } from './pages/parent/SubmissionReview';
import { EarningsSummary } from './pages/parent/EarningsSummary';
import { MonthlyPayout } from './pages/parent/MonthlyPayout';
import { TodaysChores } from './pages/kid/TodaysChores';
import { EarningsTracker } from './pages/kid/EarningsTracker';
import { History } from './pages/kid/History';

function AppRoutes() {
  const { profile, loading, needsPasswordSet, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (needsPasswordSet) return <SetPassword />;
  if (!profile) return <Login />;

  const isParent = profile.role === 'parent';

  // Build a currentUser shape compatible with existing components
  const currentUser = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    monthly_cap: profile.monthly_cap,
    avatar_color: profile.avatar_color,
    avatar_emoji: profile.avatar_emoji,
  };

  // No-op switcher — with real auth, switching users means signing out
  const switchUser = async () => { await signOut(); };

  return (
    <SessionContext.Provider value={{ currentUser, switchUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            {isParent ? (
              <>
                <Route path="parent" element={<ParentDashboard />} />
                <Route path="parent/chores" element={<ChoreCreator />} />
                <Route path="parent/review" element={<SubmissionReview />} />
                <Route path="parent/earnings" element={<EarningsSummary />} />
                <Route path="parent/payout" element={<MonthlyPayout />} />
                <Route index element={<Navigate to="/parent" replace />} />
                <Route path="*" element={<Navigate to="/parent" replace />} />
              </>
            ) : (
              <>
                <Route path="kid" element={<TodaysChores />} />
                <Route path="kid/earnings" element={<EarningsTracker />} />
                <Route path="kid/history" element={<History />} />
                <Route index element={<Navigate to="/kid" replace />} />
                <Route path="*" element={<Navigate to="/kid" replace />} />
              </>
            )}
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChoreStoreProvider>
        <AppRoutes />
      </ChoreStoreProvider>
    </AuthProvider>
  );
}
