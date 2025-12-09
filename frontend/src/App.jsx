import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import React, { lazy, Suspense, useState, useEffect } from 'react';
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Presentation = lazy(() => import('./pages/Presentation.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
import './App.css';
import Loader from './components/Loader';
import './styles/Loader.css';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  // While the auth context is initializing (checking token/profile), avoid redirecting.
  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { token, loading, user } = useAuth();
  // While the auth context is initializing, avoid redirecting.
  if (loading) return null;
  if (!token) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  const Repairers = React.lazy(() => import('./pages/Repairers.jsx'));
  const RepairersMap = React.lazy(() => import('./pages/RepairersMap.jsx'));
  return (
    <Routes>
      <Route path="/presentation" element={<Presentation />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="/repairers" element={<Repairers />} />
      <Route path="/repairers/map" element={<RepairersMapWrapper />} />
      <Route path="/demandes-offres" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

// Wrapper pour passer les réparateurs via location.state
import { useLocation } from 'react-router-dom';
import RepairersMap from './pages/RepairersMap.jsx';
const RepairersMapWrapper = () => {
  const location = useLocation();
  const repairers = location.state?.repairers || [];
  return <React.Suspense fallback={<Loader message="Chargement de la carte..." />}><RepairersMap repairers={repairers} /></React.Suspense>;
};

function App() {
  // Exemple d'état de chargement global
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simule un chargement initial (à remplacer par la logique réelle)
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader message="Chargement de la plateforme..." />;
  }

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <ErrorBoundary>
              <Suspense fallback={<Loader message="Chargement de la page..." />}> 
                <AppRoutes />
              </Suspense>
            </ErrorBoundary>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
