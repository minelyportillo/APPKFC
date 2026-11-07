import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CajeroDashboard from './pages/CajeroDashboard';
import OrderView from './pages/OrderView';
import WeatherPage from './pages/WeatherPage';
import CorteCaja from './pages/CorteCaja';
import AdminCortesCaja from './pages/AdminCortesCaja';

function RootRedirect() {
  const { user, ROLES } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.rol === ROLES.ADMIN ? '/admin' : '/cajero'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cajero"
            element={
              <ProtectedRoute allowedRoles={['cajero']}>
                <CajeroDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orden"
            element={
              <ProtectedRoute allowedRoles={['cajero']}>
                <OrderView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clima"
            element={
              <ProtectedRoute allowedRoles={['admin', 'cajero']}>
                <WeatherPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/corte-caja"
            element={
              <ProtectedRoute allowedRoles={['cajero']}>
                <CorteCaja />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/cierres-caja"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCortesCaja />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
