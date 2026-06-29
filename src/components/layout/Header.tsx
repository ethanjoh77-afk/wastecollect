import { useNotificationsStore } from "../../store";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store';
import { Avatar } from './Avatar';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const { notifications, unreadCount } = useNotificationsStore();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-secondary-100 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:flex items-center gap-2 bg-secondary-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-80">
            <Search className="w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="flex-1 bg-transparent outline-none text-secondary-900 dark:text-white placeholder-secondary-400"
            />
            <kbd className="hidden lg:block px-2 py-1 text-xs font-medium text-secondary-500 bg-white dark:bg-slate-700 border border-secondary-200 dark:border-slate-600 rounded-md">
              Ctrl+K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-secondary-100 dark:border-slate-700 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-secondary-100 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-semibold text-secondary-900 dark:text-white">
                        Notifications
                      </h3>
                      <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 hover:bg-secondary-50 dark:hover:bg-slate-700 cursor-pointer border-l-2',
                            notification.read
                              ? 'border-transparent'
                              : 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                          )}
                        >
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-secondary-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                        className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar
                src={user?.avatar_url}
                name={`${user?.first_name} ${user?.last_name}`}
                size="sm"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-secondary-400 hidden md:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-secondary-100 dark:border-slate-700 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-secondary-100 dark:border-slate-700">
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-slate-700"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-slate-700"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                    <div className="py-2 border-t border-secondary-100 dark:border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
