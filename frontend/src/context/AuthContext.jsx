// Correction Fast Refresh : exporter uniquement le provider et le hook, déplacer les constantes/fonctions partagées dans un autre fichier si besoin
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown429, setCooldown429] = useState(false);

  // If there's a token in localStorage on startup, fetch the user profile
  // Cooldown anti-429 pour éviter les appels répétés à l'API profil
  const cooldownRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    async function initFromToken() {
      if (!token) return;
      // Désactive le cooldown anti-429 en développement
      const isDev = import.meta.env.MODE === 'development';
      if (!isDev && cooldownRef.current) {
        setCooldown429(true);
        return;
      }
      setLoading(true);
      try {
        const res = await authService.getProfile();
        if (!mounted) return;
        setUser(res.data.user || null);
        setCooldown429(false);
      } catch (err) {
        // Si 429, activer le cooldown 2 minutes (prod uniquement)
        if (!isDev && err?.response?.status === 429) {
          cooldownRef.current = true;
          setCooldown429(true);
          setTimeout(() => { cooldownRef.current = false; setCooldown429(false); }, 120000);
        }
        if (import.meta.env.MODE === 'development') {
          // Utiliser le logger Pino côté backend pour les logs techniques
        }
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    initFromToken();
    return () => { mounted = false; };
  }, [token]);

  // Sync token changes across browser tabs/windows
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === 'token') {
        const newToken = e.newValue;
        if (!newToken) {
          // Token removed elsewhere: clear local auth state
          setToken(null);
          setUser(null);
        } else {
          // Update token; profile will refresh via existing effect
          if (newToken !== token) {
            setToken(newToken);
          }
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [token]);


  // Cooldown anti-429 aussi pour la connexion
  const loginCooldownRef = useRef(false);
  const [loginCooldown429, setLoginCooldown429] = useState(false);

  if (cooldown429 || loginCooldown429) {
    return <div style={{padding:32, color:'#b91c1c', background:'#fee2e2', borderRadius:8, margin:32, textAlign:'center', fontWeight:'bold', fontSize:'1.2em'}}>
      Trop de tentatives ou de requêtes.<br />Merci de patienter 2 minutes avant de réessayer.
    </div>;
  }

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
      if (import.meta.env.MODE === 'development') {
        // Utiliser le logger Pino côté backend pour les logs techniques
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const isDev = import.meta.env.MODE === 'development';
    if (!isDev && loginCooldownRef.current) {
      setLoginCooldown429(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      setLoginCooldown429(false);
      return response.data;
    } catch (err) {
      if (!isDev && err?.response?.status === 429) {
        loginCooldownRef.current = true;
        setLoginCooldown429(true);
        setTimeout(() => { loginCooldownRef.current = false; setLoginCooldown429(false); }, 120000);
      }
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
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      // Utiliser le logger Pino côté backend pour les avertissements techniques
    }
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      register: async () => { throw new Error('AuthProvider not mounted'); },
      login: async () => { throw new Error('AuthProvider not mounted'); },
      logout: () => {}
    };
  }
  return ctx;
}

// Export nommé pour compatibilité test
export { AuthContext };
