import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isDemoMode } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, User> = {
  'super@waste.gov': {
    id: '1',
    email: 'super@waste.gov',
    role: 'super_admin',
    first_name: 'Super',
    last_name: 'Admin',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'municipality@waste.gov': {
    id: '2',
    email: 'municipality@waste.gov',
    role: 'municipality_admin',
    first_name: 'Municipality',
    last_name: 'Admin',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'company@waste.com': {
    id: '3',
    email: 'company@waste.com',
    role: 'company_admin',
    first_name: 'Company',
    last_name: 'Admin',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'driver@waste.com': {
    id: '4',
    email: 'driver@waste.com',
    role: 'driver',
    first_name: 'John',
    last_name: 'Driver',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'citizen@gmail.com': {
    id: '5',
    email: 'citizen@gmail.com',
    role: 'citizen',
    first_name: 'Jane',
    last_name: 'Citizen',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isDemoMode) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      const stored = localStorage.getItem('demo_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }

    // Kama profile haipo, tumia data kutoka auth
    if (!data) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          role: "citizen",
          first_name: "",
          last_name: "",
          is_active: true,
          is_verified: true,
          created_at: authUser.created_at,
          updated_at: authUser.created_at,
        } as User);
      }

      setIsLoading(false);
      return;
    }

    setUser(data);
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};

  const login = async (email: string, password: string) => {
  setIsLoading(true);

  try {
    if (isDemoMode) {
      const demoUser = DEMO_USERS[email.toLowerCase()];

      if (demoUser && password === "demo123") {
        setUser(demoUser);
        localStorage.setItem("demo_user", JSON.stringify(demoUser));
        return;
      }

      throw new Error("Invalid credentials");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
  } finally {
    setIsLoading(false);
  }
};

  const loginWithOTP = async (phone: string) => {
  setIsLoading(true);

  try {
    if (isDemoMode) {
      console.log('Demo mode OTP for:', phone);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
  } finally {
    setIsLoading(false);
  }
};

const verifyOTP = async (phone: string, code: string) => {
  setIsLoading(true);

  try {
    if (isDemoMode) {
      if (code === '123456') {
        console.log('Demo OTP success');
        return;
      }
      throw new Error('Invalid OTP');
    }

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) throw error;
  } finally {
    setIsLoading(false);
  }
};

  const logout = async () => {
    if (isDemoMode) {
      setUser(null);
      localStorage.removeItem('demo_user');
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    if (isDemoMode) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('demo_user', JSON.stringify(updatedUser));
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithOTP,
        verifyOTP,
        logout,
        hasRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
