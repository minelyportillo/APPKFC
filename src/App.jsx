import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CajeroDashboard from './pages/CajeroDashboard';
import OrderView from './pages/OrderView';

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
              <ProtectedRoute allowedRoles={['cajero', 'admin']}>
                <CajeroDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orden"
            element={
              <ProtectedRoute allowedRoles={['cajero', 'admin']}>
                <OrderView />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
