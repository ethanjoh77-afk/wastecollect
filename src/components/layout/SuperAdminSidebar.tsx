import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Users,
  Truck,
  LifeBuoy,
  CreditCard,
  BarChart3,
  ScrollText,
  Bell,
  Settings,
  ShieldCheck,
  Brain,
  Radio,
  X,
  ShieldAlert,
  Inbox,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store';

interface SuperAdminNavItem {
  labelKey: string;
  path: string;
  icon: React.ElementType;
}

const navItems: SuperAdminNavItem[] = [
  { labelKey: 'superadmin_nav_dashboard', path: '/admin/super/dashboard', icon: LayoutDashboard },
  { labelKey: 'superadmin_nav_companies', path: '/admin/super/companies', icon: Building2 },
  { labelKey: 'superadmin_nav_admins', path: '/admin/super/admins', icon: UserCog },
  { labelKey: 'superadmin_nav_users', path: '/admin/super/users', icon: Users },
  { labelKey: 'superadmin_nav_fleet', path: '/admin/super/fleet', icon: Truck },
  { labelKey: 'superadmin_nav_support', path: '/admin/super/support', icon: LifeBuoy },
  { labelKey: 'superadmin_nav_contact_center', path: '/admin/super/contact-center', icon: Inbox },
  { labelKey: 'superadmin_nav_subscriptions', path: '/admin/super/subscriptions', icon: CreditCard },
  { labelKey: 'superadmin_nav_analytics', path: '/admin/super/analytics', icon: BarChart3 },
  { labelKey: 'superadmin_nav_audit', path: '/admin/super/audit-logs', icon: ScrollText },
  { labelKey: 'superadmin_nav_notifications', path: '/admin/super/notifications', icon: Bell },
  { labelKey: 'superadmin_nav_ai', path: '/admin/super/ai-insights', icon: Brain },
  { labelKey: 'superadmin_nav_live', path: '/admin/super/live-monitoring', icon: Radio },
  { labelKey: 'superadmin_nav_security', path: '/admin/super/security', icon: ShieldCheck },
  { labelKey: 'superadmin_nav_settings', path: '/admin/super/settings', icon: Settings },
];

export function SuperAdminSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280, width: 280 }}
        className={cn(
          'fixed top-0 left-0 h-full bg-slate-950 border-r border-slate-800 z-50',
          'flex flex-col shadow-xl lg:shadow-none lg:!translate-x-0 lg:relative'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">WasteCollect</h1>
              <p className="text-xs text-amber-400 font-medium">
                {t('superadmin_badge')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm',
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 font-medium border border-amber-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    <span>{t(item.labelKey)}</span>
                    {isActive && (
                      <motion.div
                        layoutId="superadmin-sidebar-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400"
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xs text-slate-400">{t('superadmin_platform_owner')}</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}