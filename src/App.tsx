import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { PaymentListener } from "./components/PaymentListener";
import { AdminRoute } from "./components/AdminRoute";
import { useAuth } from "./hooks/useAuth";

/* ================= LAZY PAGES ================= */
const HotspotPredictionPage = lazy(() => import("./pages/HotspotPredictionPage"));
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
  return (
    <>
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
            <Route path="/hotspots" element={<HotspotPredictionPage />} />
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

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;