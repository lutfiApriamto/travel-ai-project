import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { ROUTES } from '../../utils/consts/routes.js';

// Layout guard untuk halaman auth.
// Tugasnya hanya satu: redirect jika user sudah login.
// Setiap halaman auth mendefinisikan visual layout-nya sendiri (login, register, dll
// punya desain berbeda — tidak dipaksakan dalam satu card wrapper).
const AuthLayout = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    const dest = user?.role === 'admin' ? ROUTES.ADMIN.DASHBOARD : ROUTES.HOME;
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
};

export default AuthLayout;
