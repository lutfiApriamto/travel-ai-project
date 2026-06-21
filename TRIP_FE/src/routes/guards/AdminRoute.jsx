import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { ROUTES } from '../../utils/consts/routes.js';

// Melindungi route admin.
// Jika belum login → ke login. Jika login tapi bukan admin → ke home.
const AdminRoute = () => {
  const user = useAuthStore((s) => s.user);

  if (!user)                    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  if (user.role !== 'admin')    return <Navigate to={ROUTES.HOME} replace />;
  return <Outlet />;
};

export default AdminRoute;
