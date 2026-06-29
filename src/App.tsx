import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";

import { PaymentListener } from "./components/PaymentListener";
import { useAuth } from "./hooks/useAuth";

/* ================= LAZY PAGES ================= */

const ComplaintsPage = lazy(
  () => import("./pages/ComplaintsPage")
);

const SmartCollectionPage = lazy(
  () => import("./pages/SmartCollectionPage")
);

const TrackingPage = lazy(
  () => import("./pages/TrackingPage")
);

const GpsPage = lazy(
  () => import("./pages/GpsPage")
);

const PaymentsFeaturePage = lazy(
  () => import("./pages/PaymentsFeaturePage")
);

const LandingPage = lazy(() => import("./pages/LandingPage"));

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboardPage = lazy(
  () => import("./pages/AdminDashboardPage")
);

const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const RegisterPage = lazy(() => import("./components/auth/RegisterPage"));

const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const PaymentHistoryPage = lazy(
  () => import("./pages/PaymentHistoryPage")
);

const AdminFinancePage = lazy(
  () => import("./pages/AdminFinancePage")
);

const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const TrackTruckPage = lazy(() => import("./pages/TrackTruckPage"));
const PickupRequestPage = lazy(
  () => import("./pages/PickupRequestPage")
);

const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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
          
          <Route
            path="/features/smart-collection"
            element={<SmartCollectionPage />}
          />

          <Route
            path="/features/tracking"
            element={<TrackingPage />}
          />

          <Route
            path="/features/gps"
            element={<GpsPage />}
          />

          <Route
            path="/features/payments"
            element={<PaymentsFeaturePage />}
          /> 
          
          {/* PROTECTED */}
          <Route element={<ProtectedRoute />}>

            {/* DASHBOARDS */}
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />
            
            <Route path="/analytics" element={<div>Analytics Page</div>} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/recycling" element={<div>Recycling Page</div>} />
            <Route path="/schedules" element={<div>Schedules Page</div>} />          

            <Route
              path="/dashboard/*"
              element={<DashboardPage />}
            />

            <Route
              path="/admin/dashboard"
              element={<AdminDashboardPage />}
            />

            {/* PAYMENTS */}
            <Route
              path="/payment"
              element={<PaymentPage />}
            />

            <Route
              path="/payments/history"
              element={<PaymentHistoryPage />}
            />

            <Route
              path="/admin/finance"
              element={<AdminFinancePage />}
            />

            {/* WASTE */}
            <Route
              path="/report-issue"
              element={<ReportIssue />}
            />

            <Route
              path="/track-truck"
              element={<TrackTruckPage />}
            />

            <Route
              path="/pickup-request"
              element={<PickupRequestPage />}
            />

            {/* USER */}
            <Route
              path="/profile"
              element={<ProfilePage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

          </Route>

          {/* FALLBACK */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </Suspense>
    </>
  );
}

export default App;