import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGetMe, apiLogin, apiRegister } from '../api/auth';

const AuthContext = createContext(null);

const TOKEN_KEY = 'expense-tracker-token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // On mount: try to restore session from token
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }
      try {
        const { user: me } = await apiGetMe(token);
        setUser({ ...me, token });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({ ...data.user, token: data.token });
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await apiRegister(name, email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({ ...data.user, token: data.token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
