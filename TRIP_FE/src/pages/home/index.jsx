import { useEffect, useState }        from 'react';
import { Link }                         from 'react-router-dom';
import { motion, AnimatePresence }      from 'framer-motion';
import {
  ArrowRight, Shield, Sparkles, Clock, Send,
} from 'lucide-react';
import { ROUTES }       from '../../utils/consts/routes.js';
import { useBanners }   from './api/useHome.js';
import BannerCarousel   from './components/BannerCarousel.jsx';
import ProductSection   from './components/ProductSection.jsx';

// ─── Hero Section ─────────────────────────────────────────────────────────────

const HeroSection = () => {
  const [loopKey,      setLoopKey]      = useState(0);
  const [showUser,     setShowUser]     = useState(false);
  const [showTyping,   setShowTyping]   = useState(false);
  const [showAi,       setShowAi]       = useState(false);
  const [showProduct,  setShowProduct]  = useState(false);

  useEffect(() => {
    setShowUser(false);
    setShowTyping(false);
    setShowAi(false);
    setShowProduct(false);

    const timers = [
      setTimeout(() => setShowUser(true),                           350),
      setTimeout(() => setShowTyping(true),                        1800),
      setTimeout(() => { setShowTyping(false); setShowAi(true); }, 3200),
      setTimeout(() => setShowProduct(true),                       4000),
      setTimeout(() => setLoopKey((k) => k + 1),                  9500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [loopKey]);

  return (
    <section className="pt-6 pb-4 sm:pt-10 sm:pb-6">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* ── Kiri: Teks + CTA ────────────────────────────────────────────── */}
        <div className="space-y-6 order-2 lg:order-1">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-travia-orange/10 border border-travia-orange/20">
            <Sparkles className="w-3.5 h-3.5 text-travia-orange shrink-0" />
            <span className="text-[11px] font-semibold text-travia-orange uppercase tracking-widest">
              AI Travel Agent
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif italic font-bold text-4xl sm:text-5xl lg:text-[52px]
            leading-[1.15] text-foreground">
            Temukan perjalanan{' '}
            <span className="text-travia-orange">impian</span>{' '}
            kamu bersama AI
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
            Ceritakan ke AI kami — budget, durasi, jumlah orang, dan vibe trip
            yang kamu mau. Kami bantu rekomendasikan paket terbaik.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to={ROUTES.AI}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full
                bg-travia-orange hover:bg-travia-orange-h text-white font-semibold
                text-sm transition-colors shadow-sm"
            >
              Mulai Chat
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center h-12 px-7 rounded-full
                border border-border text-foreground font-semibold text-sm
                hover:bg-accent transition-colors"
            >
              Lihat Produk
            </Link>
          </div>
        </div>

        {/* ── Kanan: Chat Preview ─────────────────────────────────────────── */}
        <div className="relative order-1 lg:order-2">

          {/* Decorative blur blobs */}
          <div className="absolute -z-10 -bottom-8 -right-8 w-52 h-52 rounded-full
            bg-travia-orange/6 blur-3xl pointer-events-none" />
          <div className="absolute -z-10 -top-8 -left-8 w-40 h-40 rounded-full
            bg-travia-orange/4 blur-2xl pointer-events-none" />

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl
            overflow-hidden max-w-[420px] mx-auto lg:max-w-none">

            {/* Window chrome */}
            <div className="flex items-center gap-3 px-4 py-3
              border-b border-border bg-muted/40">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-travia-orange" />
                <span className="text-xs font-medium text-muted-foreground">Travia AI</span>
              </div>
              {/* Spacer untuk balance dengan dots */}
              <div className="w-12 shrink-0" />
            </div>

            {/* Chat messages area */}
            <div className="p-4 space-y-3 h-[280px] overflow-hidden">
              <AnimatePresence>

                {/* User message */}
                {showUser && (
                  <motion.div
                    key="user-msg"
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[78%] bg-travia-orange text-white text-sm
                      px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm">
                      Mau liburan ke Bali 4 hari buat 2 orang, budget 3 jutaan
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator */}
                {showTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-start"
                  >
                    <div className="bg-secondary border border-border
                      px-4 py-3 rounded-2xl rounded-tl-none">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AI message */}
                {showAi && (
                  <motion.div
                    key="ai-msg"
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex flex-col gap-2.5"
                  >
                    <div className="self-start max-w-[82%] bg-secondary border border-border
                      text-foreground text-sm px-4 py-2.5 rounded-2xl rounded-tl-none">
                      Oke! Aku temukan paket yang pas buatmu&nbsp;🎉
                    </div>

                    {/* Product card preview */}
                    {showProduct && (
                      <motion.div
                        key="product-card"
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="self-start w-[88%] border border-border rounded-xl
                          overflow-hidden bg-background shadow-sm"
                      >
                        {/* Fake thumbnail */}
                        <div className="h-[70px] bg-gradient-to-br
                          from-travia-orange/15 via-travia-orange/8 to-transparent
                          flex items-center justify-center">
                          <span className="text-3xl select-none">🏖️</span>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            Bali Open Trip
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            4 Hari 3 Malam&nbsp;·&nbsp;2 Peserta
                          </p>
                          <p className="text-sm font-bold text-travia-orange mt-1.5">
                            Rp 2.800.000
                            <span className="text-[11px] font-normal text-muted-foreground">
                              &nbsp;/orang
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Input bar (dekoratif) */}
            <div className="px-4 py-3 border-t border-border flex items-center gap-2">
              <div className="flex-1 h-9 px-3.5 rounded-full bg-muted/60 border border-border
                text-xs text-muted-foreground flex items-center select-none">
                Ceritakan trip impianmu...
              </div>
              <button
                tabIndex={-1}
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-travia-orange flex items-center
                  justify-center text-white shrink-0 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

// ─── Trust Bar ────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { value: '500+', label: 'Destinasi Tersedia'  },
  { value: 'AI',   label: 'Rekomendasi Cerdas'  },
  { value: '100%', label: 'Paket Terverifikasi' },
  { value: '24/7', label: 'Dukungan Perjalanan' },
];

const TrustBar = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border">
    {TRUST_ITEMS.map(({ value, label }) => (
      <div key={label} className="text-center">
        <p className="font-bold text-xl sm:text-2xl text-travia-orange">{value}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    ))}
  </div>
);

// ─── Why Travia Section ───────────────────────────────────────────────────────

const WHY_ITEMS = [
  {
    Icon:  Sparkles,
    title: 'Rekomendasi Cerdas',
    desc:  'Travia AI memahami preferensi perjalananmu dan menyarankan paket yang benar‑benar sesuai, bukan sekadar iklan.',
  },
  {
    Icon:  Shield,
    title: 'Paket Terpercaya',
    desc:  'Setiap paket dikurasi dan diverifikasi secara menyeluruh — detail itinerary, harga, dan ketersediaan selalu akurat.',
  },
  {
    Icon:  Clock,
    title: 'Pemesanan Kilat',
    desc:  'Dari pencarian hingga konfirmasi dalam hitungan menit. Pembayaran aman, tiket langsung di tanganmu.',
  },
];

const WhyTravia = () => (
  <section>
    <div className="text-center mb-10">
      <h2 className="font-serif italic text-2xl sm:text-3xl text-foreground">
        Kenapa Memilih Tr<span className="text-travia-orange">avi</span>a?
      </h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
        Kami menggabungkan kecerdasan buatan dengan pilihan paket perjalanan terbaik
        untuk pengalaman liburan yang tak terlupakan.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {WHY_ITEMS.map(({ Icon, title, desc }) => (
        <div
          key={title}
          className="bg-card border border-border rounded-2xl p-6 hover:shadow-md
            hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-11 h-11 rounded-xl bg-travia-orange/10 flex items-center
            justify-center text-travia-orange mb-4">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// ─── HomePage ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { data: banners = [], isLoading: bannersLoading } = useBanners();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-12 sm:space-y-16">

      {/* Hero Section — above the fold, langsung tampilkan value prop + AI */}
      <HeroSection />

      {/* Banner Carousel */}
      {bannersLoading ? (
        <div className="w-full aspect-[21/7] sm:aspect-[21/6] lg:aspect-[21/5]
          rounded-2xl bg-muted animate-pulse" />
      ) : (
        <BannerCarousel banners={banners} />
      )}

      {/* Trust Bar */}
      <TrustBar />

      {/* Product Section (category filter + infinite scroll) */}
      <ProductSection />

      {/* Why Travia */}
      <WhyTravia />

    </div>
  );
};

export default HomePage;
