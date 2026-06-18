import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eduTask_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const savedUser = localStorage.getItem('eduTask_user');
      if (savedUser && !user) {
        try {
          // Verify cookie is still valid
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('eduTask_user', JSON.stringify(currentUser));
        } catch (error) {
          // Cookie invalid/expired, clear storage
          localStorage.removeItem('eduTask_user');
        }
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback(async (loginStr: string, password: string): Promise<boolean> => {
    setLoading(true);

    try {
      const response = await authApi.login(loginStr, password);

      // Token is now in httpOnly cookie, just store user info
      localStorage.setItem('eduTask_user', JSON.stringify(response.user));
      setUser(response.user);

      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('eduTask_user');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading,
    }}>
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

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return { authorized: false, user: null };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { authorized: false, user };
  }

  return { authorized: true, user };
}
