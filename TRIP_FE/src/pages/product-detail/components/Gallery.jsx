import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { motion, AnimatePresence }             from 'framer-motion';
import { cn }                                  from '../../../lib/utils.js';

// Gabung thumbnail + gallery menjadi satu array foto
const buildImages = (thumbnail, gallery = []) => {
  const all = [];
  if (thumbnail) all.push(thumbnail);
  gallery.forEach((url) => { if (url && url !== thumbnail) all.push(url); });
  return all;
};

const Gallery = ({ thumbnail, gallery = [] }) => {
  const images          = buildImages(thumbnail, gallery);
  const [current, setCurrent] = useState(0);
  const [dir, setDir]         = useState(1);

  const goTo = useCallback((index, direction = 1) => {
    setDir(direction);
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    goTo((current - 1 + images.length) % images.length, -1);
  }, [current, images.length, goTo]);

  const next = useCallback(() => {
    goTo((current + 1) % images.length, 1);
  }, [current, images.length, goTo]);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] rounded-2xl bg-muted flex flex-col
        items-center justify-center gap-3 text-muted-foreground/40">
        <ImageOff className="w-10 h-10" />
        <p className="text-sm">Belum ada foto produk</p>
      </div>
    );
  }

  const variants = {
    enter:  (d) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0, scale: 0.98 }),
    center: ()  => ({ x: 0,                         opacity: 1, scale: 1   }),
    exit:   (d) => ({ x: d > 0 ? '-60%' : '60%',   opacity: 0, scale: 0.98 }),
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
        <AnimatePresence initial={false} custom={dir} mode="sync">
          <motion.img
            key={current}
            src={images[current]}
            alt={`Foto produk ${current + 1}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </AnimatePresence>

        {/* Counter badge */}
        {images.length > 1 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full
            bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm">
            {current + 1} / {images.length}
          </span>
        )}

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Foto sebelumnya"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                bg-black/40 backdrop-blur-sm text-white hover:bg-black/60
                flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Foto berikutnya"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                bg-black/40 backdrop-blur-sm text-white hover:bg-black/60
                flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip — hanya jika > 1 foto */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className={cn(
                'shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden',
                'border-2 transition-all duration-200',
                i === current
                  ? 'border-travia-orange scale-[1.02]'
                  : 'border-transparent hover:border-border opacity-70 hover:opacity-100',
              )}
            >
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
