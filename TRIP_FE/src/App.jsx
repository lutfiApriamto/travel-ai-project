import { useEffect, useRef, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './routes/index.jsx';
import { queryClient } from './lib/queryClient.js';
import { useAuthStore } from './stores/useAuthStore.js';
import { useTheme } from './context/ThemeContext.jsx';
import api from './lib/axios.js';

// ─── App Bootstrap ────────────────────────────────────────────────────────────
// Sebelum render router, coba restore sesi user via refresh endpoint.
// Jika refresh berhasil → user dianggap login (set auth store).
// Jika gagal → user tidak login, tampilkan halaman publik.
// Ini mencegah "flash" ke halaman login saat user refresh browser.

const AppContent = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setAuth } = useAuthStore();
  // Guard agar session restore hanya berjalan sekali —
  // React 18 StrictMode memanggil useEffect dua kali di development,
  // yang akan merusak token rotation (token lama sudah dirotasi di invoke pertama).
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const restoreSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        // Response shape: { errorStatus, data: { data: { accessToken, user }, message } }
        const { accessToken, user } = res.data.data.data;
        setAuth({ accessToken, user });
      } catch {
        // Tidak ada sesi aktif — biarkan user sebagai guest
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, [setAuth]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <img
          src="/brand-logo/logo-stacked-light.svg"
          alt="Travia"
          className="dark:hidden animate-pulse"
          style={{ height: 'clamp(120px, 22vw, 200px)', width: 'auto' }}
        />
        <img
          src="/brand-logo/logo-stacked-dark.svg"
          alt="Travia"
          className="hidden dark:block animate-pulse"
          style={{ height: 'clamp(120px, 22vw, 200px)', width: 'auto' }}
        />
      </div>
    );
  }

  return <RouterProvider router={router} />;
};

// ─── App Root ─────────────────────────────────────────────────────────────────

const App = () => {
  const { isDark } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: isDark ? '#2C2C2E' : '#FFFFFF',
            color:      isDark ? '#EBEBF5' : '#1C1C1E',
            border:     isDark ? '1px solid #3A3A3C' : '1px solid #E5E5EA',
            fontSize:   '14px',
            fontFamily: 'Inter, Arial, sans-serif',
          },
          success: {
            iconTheme: { primary: '#17B26A', secondary: isDark ? '#2C2C2E' : '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#F04438', secondary: isDark ? '#2C2C2E' : '#FFFFFF' },
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;
