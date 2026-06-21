import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate }                               from 'react-router-dom';
import { motion, AnimatePresence }                   from 'framer-motion';
import { ChevronLeft, ChevronRight }                 from 'lucide-react';
import { cn }                                        from '../../../lib/utils.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isInternalUrl = (link) => {
  if (!link) return false;
  try {
    const url = new URL(link);
    return url.origin === window.location.origin;
  } catch {
    // relative path → internal
    return true;
  }
};

const resolveInternalPath = (link) => {
  try {
    return new URL(link).pathname;
  } catch {
    return link;
  }
};

// ─── BannerCarousel ───────────────────────────────────────────────────────────

const BannerCarousel = ({ banners = [] }) => {
  const navigate                    = useNavigate();
  const [current, setCurrent]       = useState(0);
  const [paused,  setPaused]        = useState(false);
  const [direction, setDirection]   = useState(1); // 1 = forward, -1 = backward
  const touchStartX                 = useRef(null);
  const total                       = banners.length;

  const goTo = useCallback((index, dir = 1) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, -1);
  }, [current, total, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % total, 1);
  }, [current, total, goTo]);

  // Auto-play
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(() => next(), 4500);
    return () => clearInterval(timer);
  }, [paused, total, next]);

  // Touch swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const handleBannerClick = (banner) => {
    if (!banner.link) return;
    if (isInternalUrl(banner.link)) {
      navigate(resolveInternalPath(banner.link));
    } else {
      window.open(banner.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (total === 0) {
    // Fallback placeholder saat belum ada banner
    return (
      <div className="w-full aspect-[21/7] sm:aspect-[21/6] rounded-2xl bg-gradient-to-br
        from-travia-orange/20 to-amber-100 dark:to-amber-950/30 flex items-center justify-center">
        <p className="font-serif italic text-2xl text-travia-orange/60">Travia</p>
      </div>
    );
  }

  const variants = {
    enter:   (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0   }),
    center:  ()    => ({ x: 0,                            opacity: 1   }),
    exit:    (dir) => ({ x: dir > 0 ? '-100%' : '100%',  opacity: 0   }),
  };

  return (
    <div
      className="relative w-full aspect-[21/7] sm:aspect-[21/6] lg:aspect-[21/5]
        rounded-2xl overflow-hidden bg-muted select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={banners[current].image}
            alt={banners[current].title ?? 'Banner Travia'}
            className={cn(
              'w-full h-full object-cover',
              banners[current].link && 'cursor-pointer',
            )}
            onClick={() => handleBannerClick(banners[current])}
            draggable={false}
          />

          {/* Gradient overlay + title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          {banners[current].title && (
            <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-5 sm:pb-7">
              <p className="text-white font-bold text-base sm:text-xl lg:text-2xl
                drop-shadow-lg max-w-2xl leading-snug">
                {banners[current].title}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next — only if more than 1 */}
      {total > 1 && (
        <>
          <button
            aria-label="Banner sebelumnya"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
              bg-black/30 backdrop-blur-sm text-white hover:bg-black/50
              flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            aria-label="Banner berikutnya"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
              bg-black/30 backdrop-blur-sm text-white hover:bg-black/50
              flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={`Ke banner ${i + 1}`}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={cn(
                'rounded-full transition-all duration-300 bg-white/80',
                i === current ? 'w-5 h-2' : 'w-2 h-2 hover:bg-white',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
