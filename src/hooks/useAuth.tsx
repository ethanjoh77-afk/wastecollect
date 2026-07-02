import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { User, UserRole } from "../types";
import { supabase } from "../lib/supabase";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ================= INIT AUTH =================
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        await fetchUserProfile(data.session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ================= FETCH PROFILE =================
  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;

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

        return;
      }

      setUser(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= LOGIN =================
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
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

  // ================= OTP =================
  const loginWithOTP = async (phone: string) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (phone: string, code: string) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // ================= ROLE CHECK =================
  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;

    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role);
  };

  // ================= UPDATE USER =================
  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) throw error;

    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
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

// ================= HOOK =================
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}