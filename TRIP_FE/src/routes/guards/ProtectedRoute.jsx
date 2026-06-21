import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { ROUTES } from '../../utils/consts/routes.js';

// Melindungi route yang butuh login.
// Jika belum login → redirect ke halaman login.
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.AUTH.LOGIN} replace />;
};

export default ProtectedRoute;
