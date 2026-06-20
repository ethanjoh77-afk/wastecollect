import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  Truck,
  Route,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Recycle,
  Trash2,
  MessageSquare,
  X,
  Leaf,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store';
import { UserRole } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', path: '/users', icon: Users, roles: ['super_admin'] },
  { name: 'Municipalities', path: '/municipalities', icon: Building2, roles: ['super_admin'] },
  { name: 'Companies', path: '/companies', icon: Building2, roles: ['super_admin', 'municipality_admin'] },
  { name: 'Drivers', path: '/drivers', icon: Truck, roles: ['super_admin', 'municipality_admin', 'company_admin'] },
  { name: 'Vehicles', path: '/vehicles', icon: Truck },
  { name: 'Routes', path: '/routes', icon: Route, roles: ['super_admin', 'municipality_admin', 'company_admin', 'driver'] },
  { name: 'Zones', path: '/zones', icon: MapPin, roles: ['super_admin', 'municipality_admin'] },
  { name: 'Schedules', path: '/schedules', icon: Calendar },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Smart Bins', path: '/smart-bins', icon: Trash2, roles: ['super_admin', 'municipality_admin'] },
  { name: 'Recycling', path: '/recycling', icon: Recycle },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Complaints', path: '/complaints', icon: MessageSquare },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Audit Logs', path: '/audit-logs', icon: Shield, roles: ['super_admin'] },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role as UserRole)
  );

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
        animate={{
          x: sidebarOpen ? 0 : -280,
          width: 280,
        }}
        className={cn(
          'fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-secondary-100 dark:border-slate-700 z-50',
          'flex flex-col shadow-xl lg:shadow-none lg:relative lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-secondary-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">WasteCollect</h1>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Digital System</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary-500 text-white font-medium shadow-md'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="ml-auto w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-secondary-100 dark:border-slate-700">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4">
            <h4 className="font-semibold text-secondary-900 dark:text-white text-sm">Need Help?</h4>
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
              Contact our support team
            </p>
            <button className="mt-3 w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
              Get Support
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
