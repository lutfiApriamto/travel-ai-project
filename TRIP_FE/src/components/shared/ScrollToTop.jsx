import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/**
 * Wrapper route component — scroll ke paling atas setiap kali pathname berubah.
 * Letakkan sebagai element wrapper di root router agar berlaku untuk semua halaman.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <Outlet />;
};

export default ScrollToTop;
