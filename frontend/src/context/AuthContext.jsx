import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If there's a token in localStorage on startup, fetch the user profile
  useEffect(() => {
    let mounted = true;
    async function initFromToken() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await authService.getProfile();
        if (!mounted) return;
        setUser(res.data.user || null);
      } catch (err) {
        // If token is invalid, clear it to avoid stale state
        console.error('Failed to initialize user from token:', err?.response?.data || err.message);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    initFromToken();
    return () => { mounted = false; };
  }, [token]);

  const register = async (email, password, name, phone, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(email, password, name, phone, role);
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      console.error('[REGISTER ERROR]', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
