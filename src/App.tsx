import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 dark:border-slate-700 rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-secondary-600 dark:text-secondary-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
