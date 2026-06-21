import { useEffect, useRef } from 'react';

// Memicu callback ketika elemen masuk viewport.
// Digunakan untuk infinite scroll cursor-based (notifikasi).
export const useIntersectionObserver = (callback, options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) callback();
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
};
