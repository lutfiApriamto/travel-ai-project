import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, Loader2 } from 'lucide-react';

const QrScanner = ({ onScan }) => {
  const [status,   setStatus]   = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');

  // Stable ref so onScan changes don't re-run the effect
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // Unique element ID per mount — avoids StrictMode conflicts
  const elementId = useRef(`travia-qr-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let isActive = true; // becomes false when cleanup runs
    let started  = false; // becomes true when scanner.start() resolves
    let scanner  = null;

    // ── Async cleanup helper — suppresses ALL errors ──────────────────────
    const tryStop = async (sc) => {
      if (!sc) return;
      try { await sc.stop(); }  catch {}
      try { sc.clear();      }  catch {}
    };

    // ── Start scanner ──────────────────────────────────────────────────────
    try {
      scanner = new Html5Qrcode(elementId.current, { verbose: false });
    } catch {
      if (isActive) {
        setStatus('error');
        setErrorMsg('Gagal inisialisasi scanner. Refresh halaman dan coba lagi.');
      }
      return;
    }

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps:   10,
          qrbox: (viewW, viewH) => {
            const s = Math.round(Math.min(viewW, viewH) * 0.72);
            return { width: s, height: s };
          },
        },
        // ── QR detected ──────────────────────────────────────────────────
        (text) => {
          if (!isActive) return;
          isActive = false; // prevent double fire
          started  = false;
          tryStop(scanner).then(() => {
            onScanRef.current(text.trim());
          });
        },
        () => {} // per-frame decode error — normal, not critical
      )
      .then(() => {
        if (!isActive) {
          // Cleanup already ran while start was in progress — stop immediately
          tryStop(scanner);
          return;
        }
        started = true;
        setStatus('scanning');
      })
      .catch((err) => {
        if (!isActive) return;
        setStatus('error');

        const msg = String(err?.message ?? err ?? '').toLowerCase();
        if (msg.includes('notallowed') || msg.includes('permission') || msg.includes('denied')) {
          setErrorMsg('Akses kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu muat ulang halaman.');
        } else if (msg.includes('notfound') || msg.includes('no camera') || msg.includes('devicenotfound')) {
          setErrorMsg('Kamera tidak ditemukan pada perangkat ini.');
        } else {
          setErrorMsg('Gagal mengakses kamera. Gunakan input manual sebagai alternatif.');
        }
      });

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      isActive = false;

      if (started) {
        // Scanner is running — safe to stop
        tryStop(scanner);
      }
      // If not started yet, the .then() above will detect !isActive and stop
    };
  // Empty deps — stable thanks to onScanRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Error state ──────────────────────────────────────────────────────────

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <CameraOff className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm font-medium text-foreground">Kamera tidak tersedia</p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{errorMsg}</p>
      </div>
    );
  }

  // ── Scanner view ─────────────────────────────────────────────────────────

  return (
    <div className="relative w-full">
      {/* Loading overlay */}
      {status === 'starting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10
          bg-background/70 rounded-xl gap-2">
          <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
          <p className="text-xs text-muted-foreground">Mengakses kamera...</p>
        </div>
      )}

      {/*
        html5-qrcode injects a <video> element inside this div.
        [&_video] uses Tailwind arbitrary child selector to style the injected element.
        [&_img]:hidden hides the snapshot image html5-qrcode injects.
      */}
      <div
        id={elementId.current}
        className="w-full rounded-xl overflow-hidden
          [&_video]:w-full [&_video]:rounded-xl [&_video]:object-cover
          [&_img]:hidden [&_canvas]:hidden"
      />

      {status === 'scanning' && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Arahkan kamera ke QR Code pada tiket
        </p>
      )}
    </div>
  );
};

export default QrScanner;
