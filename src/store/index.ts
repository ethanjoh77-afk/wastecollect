import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vehicle, Notification, Driver } from '../types';

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'app-store' }
  )
);

interface DriversState {
  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;
  addDriver: (driver: Driver) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
}

export const useDriversStore = create<DriversState>((set) => ({
  drivers: [],
  setDrivers: (drivers) => set({ drivers }),
  addDriver: (driver) => set((state) => ({ drivers: [...state.drivers, driver] })),
  updateDriver: (id, updates) => set((state) => ({
    drivers: state.drivers.map((d) => (d.user_id === id ? { ...d, ...updates } : d)),
  })),
}));

interface VehiclesState {
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
}

export const useVehiclesStore = create<VehiclesState>((set) => ({
  vehicles: [],
  setVehicles: (vehicles) => set({ vehicles }),
}));

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    unreadCount: 0,
  })),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1,
  })),
}));
