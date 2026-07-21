import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PaymentListener } from "./components/PaymentListener";
import { AdminRoute } from "./components/AdminRoute";
import { useAuth } from "./hooks/useAuth";
import { SplashScreen } from "./components/common/SplashScreen";

/* ================= LAZY PAGES ================= */
const SuperAdminComingSoon = lazy(() =>
  import("./components/superadmin/ComingSoon").then((m) => ({ default: m.SuperAdminComingSoon }))
);
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const RegisterPage = lazy(() => import("./components/auth/RegisterPage"));

const SmartCollectionPage = lazy(() => import("./pages/SmartCollectionPage"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const GpsPage = lazy(() => import("./pages/GpsPage"));
const PaymentsFeaturePage = lazy(() => import("./pages/PaymentsFeaturePage"));

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ComplaintsPage = lazy(() => import("./pages/ComplaintsPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const PaymentHistoryPage = lazy(() => import("./pages/PaymentHistoryPage"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const TrackTruckPage = lazy(() => import("./pages/TrackTruckPage"));
const PickupRequestPage = lazy(() => import("./pages/PickupRequestPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminFinancePage = lazy(() => import("./pages/AdminFinancePage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));

const SuperAdminDashboardPage = lazy(() => import("./pages/superadmin/SuperAdminDashboardPage"));

/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/* ================= APP ================= */
function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      <PaymentListener />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        }
      >
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/features/smart-collection" element={<SmartCollectionPage />} />
          <Route path="/features/tracking" element={<TrackingPage />} />
          <Route path="/features/gps" element={<GpsPage />} />
          <Route path="/features/payments" element={<PaymentsFeaturePage />} />

          {/* PROTECTED — login inatosha */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/*" element={<DashboardPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/payments" element={<PaymentPage />} />
            <Route path="/payments/history" element={<PaymentHistoryPage />} />
            <Route path="/report-issue" element={<ReportIssue />} />
            <Route path="/track-truck" element={<TrackTruckPage />} />
            <Route path="/pickup-request" element={<PickupRequestPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Placeholders — zinaonyesha ukurasa badala ya kurudi home */}
            <Route
              path="/schedules"
              element={
                <div className="flex items-center justify-center min-h-screen text-gray-400 text-xl">
                  🗓️ Schedules — Coming Soon
                </div>
              }
            />
            <Route
              path="/recycling"
              element={
                <div className="flex items-center justify-center min-h-screen text-gray-400 text-xl">
                  ♻️ Recycling — Coming Soon
                </div>
              }
            />
          </Route>

          {/* ADMIN ONLY */}
          <Route element={<AdminRoute roles={["super_admin", "municipality_admin", "company_admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/reports" element={<AdminReportsPage />} />
            <Route
              path="/analytics"
              element={
                <div className="flex items-center justify-center min-h-screen text-gray-400 text-xl">
                  📊 Analytics — Coming Soon
                </div>
              }
            />
          </Route>

          <Route element={<AdminRoute roles={["super_admin", "municipality_admin"]} />}>
            <Route path="/admin/finance" element={<AdminFinancePage />} />
          </Route>

          {/* SUPER ADMIN ONLY — dashibodi tofauti kabisa, si sehemu ya company/municipality admin */}
          <Route element={<AdminRoute roles={["super_admin"]} />}>
            <Route path="/admin/super/dashboard" element={<SuperAdminDashboardPage />} />
            <Route
              path="/admin/super/companies"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_companies" phaseLabel="Awamu ya 2" />}
            />
            <Route
              path="/admin/super/admins"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_admins" phaseLabel="Awamu ya 2" />}
            />
            <Route
              path="/admin/super/users"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_users" phaseLabel="Awamu ya 3" />}
            />
            <Route
              path="/admin/super/fleet"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_fleet" phaseLabel="Awamu ya 3" />}
            />
            <Route
              path="/admin/super/support"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_support" phaseLabel="Awamu ya 4" />}
            />
            <Route
              path="/admin/super/subscriptions"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_subscriptions" phaseLabel="Awamu ya 5" />}
            />
            <Route
              path="/admin/super/analytics"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_analytics" phaseLabel="Awamu ya 5" />}
            />
            <Route
              path="/admin/super/audit-logs"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_audit" phaseLabel="Awamu ya 5" />}
            />
            <Route
              path="/admin/super/notifications"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_notifications" phaseLabel="Awamu ya 4" />}
            />
            <Route
              path="/admin/super/ai-insights"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_ai" phaseLabel="Awamu ya 6" />}
            />
            <Route
              path="/admin/super/live-monitoring"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_live" phaseLabel="Awamu ya 6" />}
            />
            <Route
              path="/admin/super/security"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_security" phaseLabel="Awamu ya 6" />}
            />
            <Route
              path="/admin/super/settings"
              element={<SuperAdminComingSoon titleKey="superadmin_nav_settings" phaseLabel="Awamu ya 6" />}
            />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;