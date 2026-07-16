import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Home, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAppStore } from "../../store";

export function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();
  const { toggleSidebar } = useAppStore();

  const homePath = hasRole(["super_admin", "municipality_admin", "company_admin"])
    ? "/admin/dashboard"
    : "/dashboard";

  const isHome = location.pathname === homePath || location.pathname === "/dashboard";

  function handleBack() {
    // Standalone PWA has no browser back button, so fall back to Home
    // if there's nowhere in our own history to go back to.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(homePath);
    }
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-secondary-200 dark:border-slate-700 flex items-stretch pb-[env(safe-area-inset-bottom)]">
      <button
        onClick={handleBack}
        disabled={isHome}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-secondary-500 dark:text-secondary-400 disabled:opacity-30 active:bg-secondary-100 dark:active:bg-slate-700 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
        <span className="text-[11px] font-medium">Nyuma</span>
      </button>

      <button
        onClick={() => navigate(homePath)}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors active:bg-secondary-100 dark:active:bg-slate-700 ${
          isHome
            ? "text-primary-600 dark:text-primary-400"
            : "text-secondary-500 dark:text-secondary-400"
        }`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[11px] font-medium">Nyumbani</span>
      </button>

      <button
        onClick={toggleSidebar}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-secondary-500 dark:text-secondary-400 active:bg-secondary-100 dark:active:bg-slate-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
        <span className="text-[11px] font-medium">Menyu</span>
      </button>
    </nav>
  );
}
