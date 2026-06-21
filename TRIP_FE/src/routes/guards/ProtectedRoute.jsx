import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { ROUTES }       from '../../utils/consts/routes.js';
import AuthRequiredModal from '../../components/shared/AuthRequiredModal.jsx';

/**
 * Melindungi route yang butuh login.
 * Jika belum login → tampilkan AuthRequiredModal (bukan redirect langsung).
 *   - "Masuk / Daftar" → ke halaman login dengan redirect param
 *   - "Tetap di Sini"  → kembali ke halaman sebelumnya (atau Home)
 */
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate        = useNavigate();
  const location        = useLocation();

  if (isAuthenticated) return <Outlet />;

  const handleLogin = () => {
    navigate(
      `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`,
    );
  };

  const handleClose = () => {
    // Kembali ke halaman sebelumnya; jika tidak ada history, ke Home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  return (
    <AuthRequiredModal
      isOpen={true}
      onLogin={handleLogin}
      onClose={handleClose}
    />
  );
};

export default ProtectedRoute;
