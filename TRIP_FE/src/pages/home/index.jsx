import { useEffect, useState }   from 'react';
import { Link }                    from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowDown, Sparkles, Shield, Clock, Send,
} from 'lucide-react';
import { ROUTES }     from '../../utils/consts/routes.js';
import { useBanners } from './api/useHome.js';
import BannerCarousel from './components/BannerCarousel.jsx';
import ProductSection from './components/ProductSection.jsx';

// ─── Hero Section ──────────────────────────────────────────────────────────────

const HeroSection = () => {
  const [loopKey,      setLoopKey]      = useState(0);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showUser,     setShowUser]     = useState(false);
  const [showTyping,   setShowTyping]   = useState(false);
  const [showAi,       setShowAi]       = useState(false);
  const [showProduct,  setShowProduct]  = useState(false);

  useEffect(() => {
    setShowGreeting(false);
    setShowUser(false);
    setShowTyping(false);
    setShowAi(false);
    setShowProduct(false);

    const timers = [
      setTimeout(() => setShowGreeting(true),                          200),
      setTimeout(() => setShowUser(true),                             1400),
      setTimeout(() => setShowTyping(true),                           2600),
      setTimeout(() => { setShowTyping(false); setShowAi(true); },   4000),
      setTimeout(() => setShowProduct(true),                          4700),
      setTimeout(() => setLoopKey((k) => k + 1),                    10500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loopKey]);

  return (
    <section className="relative py-14 sm:py-20 overflow-hidden">

      {/* Ambient orange glow — atas kanan */}
      <div className="absolute -z-10 top-0 right-0 w-[700px] h-[700px] rounded-full
        bg-travia-orange/7 blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />

      <div className="grid lg:grid-cols-[45%_1fr] gap-12 lg:gap-10 items-center">

        {/* ── Kiri ──────────────────────────────────────────────────────── */}
        <div className="space-y-8 order-2 lg:order-1">

          {/* Heading — pendek, percakapan */}
          <h1 className="font-serif italic font-bold text-foreground
            text-[44px] sm:text-[58px] lg:text-[66px] leading-[1.06]">
            Mau ke mana?<br />
            <span className="text-travia-orange">Ceritakan aja.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[400px]">
            Travia AI bantu kamu temukan paket perjalanan terbaik sesuai budget,
            durasi, dan vibe tripmu — cukup dengan ngobrol.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.AI}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full
                bg-travia-orange hover:bg-travia-orange-h text-white font-semibold
                text-sm transition-colors shadow-md"
            >
              Mulai Ngobrol
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={ROUTES.PRODUCTS}
              className="inline-flex items-center h-12 px-8 rounded-full
                border border-border text-foreground font-semibold text-sm
                hover:bg-accent transition-colors"
            >
              Lihat Paket
            </Link>
          </div>

          {/* Micro stats */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { v: '500+', l: 'destinasi' },
              { v: '100%', l: 'terverifikasi' },
              { v: '24/7', l: 'dukungan' },
            ].map(({ v, l }, i) => (
              <div key={l} className="flex items-baseline gap-1.5">
                {i > 0 && (
                  <span className="mr-4 -ml-2 w-px h-4 bg-border inline-block self-center" />
                )}
                <span className="font-serif italic font-bold text-lg text-travia-orange">{v}</span>
                <span className="text-xs text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kanan: Chat Preview ───────────────────────────────────────── */}
        <div className="relative order-1 lg:order-2">

          {/* Glow behind card */}
          <div className="absolute -z-10 -inset-4 bg-travia-orange/6 rounded-3xl
            blur-2xl pointer-events-none" />

          {/* Card */}
          <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border
            max-w-[440px] mx-auto lg:max-w-none">

            {/* Orange accent bar */}
            <div className="h-0.5 w-full bg-travia-orange" />

            {/* Window chrome */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-travia-orange" />
                <span className="text-xs font-semibold text-foreground/70">Travia AI</span>
              </div>
              {/* Online indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Online</span>
              </div>
            </div>

            {/* Chat messages */}
            <div className="p-4 space-y-3 min-h-[380px] bg-background">
              <AnimatePresence>

                {/* AI greeting */}
                {showGreeting && (
                  <motion.div key="greeting"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[82%] bg-card border border-border text-foreground
                      text-sm px-4 py-2.5 rounded-2xl rounded-tl-none">
                      Hai! 👋 Mau trip kemana nih?
                    </div>
                  </motion.div>
                )}

                {/* User message */}
                {showUser && (
                  <motion.div key="user-msg"
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[78%] bg-travia-orange text-white text-sm
                      px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm">
                      Bali, 4 hari buat 2 orang. Budget 3 jutaan, suka pantai!
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator */}
                {showTyping && (
                  <motion.div key="typing"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border border-border
                      px-4 py-3 rounded-2xl rounded-tl-none">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AI reply + products */}
                {showAi && (
                  <motion.div key="ai-msg"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex flex-col gap-2.5"
                  >
                    <div className="self-start max-w-[82%] bg-card border border-border
                      text-foreground text-sm px-4 py-2.5 rounded-2xl rounded-tl-none">
                      Cocok banget! Ini 2 paket yang aku rekomendasikan 🎉
                    </div>

                    {/* Product cards — keduanya muncul saat showProduct */}
                    {showProduct && (
                      <div className="flex flex-col gap-2 w-[90%]">
                        {[
                          { emoji: '🏖️', name: 'Bali Coastal Trip', meta: '4H3M · 2 Peserta', price: 'Rp 2.600.000' },
                          { emoji: '🌴', name: 'Bali Alam & Pantai', meta: '4H3M · 2 Peserta', price: 'Rp 2.850.000' },
                        ].map((pkg, i) => (
                          <motion.div key={pkg.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.18 }}
                            className="flex items-center gap-3 bg-background border border-border
                              rounded-xl px-3 py-2.5 shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-lg bg-travia-orange/10 flex items-center
                              justify-center text-xl shrink-0">
                              {pkg.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                                {pkg.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{pkg.meta}</p>
                            </div>
                            <p className="text-sm font-bold text-travia-orange shrink-0">{pkg.price}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Input bar (dekoratif) */}
            <div className="px-4 py-3 border-t border-border flex items-center gap-2 bg-card/40">
              <div className="flex-1 h-9 px-4 rounded-full bg-background border border-border
                text-xs text-muted-foreground flex items-center select-none">
                Ketik destinasi atau pertanyaanmu...
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

// ─── How It Works ─────────────────────────────────────────────────────────────
// Sequence genuinely 3 steps: tell → AI finds → book

const HOW_ITEMS = [
  {
    Icon:  Sparkles,
    title: 'Ceritakan tripmu',
    desc:  'Budget, destinasi, berapa hari, dan vibe yang kamu mau. Tidak perlu form — cukup ngobrol.',
  },
  {
    Icon:  Shield,
    title: 'AI rekomendasikan',
    desc:  'AI kami analisa kebutuhanmu dan temukan paket terbaik dari ratusan pilihan yang sudah terverifikasi.',
  },
  {
    Icon:  Clock,
    title: 'Pesan & berangkat',
    desc:  'Pilih paket, bayar aman lewat berbagai metode, dan tiket langsung di tangan kamu.',
  },
];

const HowItWorks = () => (
  <section>
    <div className="text-center mb-12">
      <h2 className="font-serif italic text-3xl sm:text-4xl text-foreground">
        Cara kerjanya{' '}
        <span className="text-travia-orange">sederhana</span>
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
        Dari cerita sampai tiket — semuanya cepat, mudah, dan terpercaya.
      </p>
    </div>

    {/* 3 steps — responsive: stacked mobile, horizontal desktop */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
      {HOW_ITEMS.map(({ Icon, title, desc }, idx) => (
        <div key={title} className="relative flex sm:flex-col items-start sm:items-center
          gap-5 sm:gap-4 p-6 sm:p-8 text-left sm:text-center
          border-b sm:border-b-0 sm:border-r border-border last:border-0">

          {/* Step circle */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-travia-orange/30
              bg-travia-orange/8 flex items-center justify-center text-travia-orange">
              <Icon className="w-5 h-5" />
            </div>
            {/* Step number */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full
              bg-travia-orange text-white text-[10px] font-bold
              flex items-center justify-center leading-none">
              {idx + 1}
            </span>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-foreground text-base mb-1.5">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>

          {/* Connector arrow (desktop only, not on last) */}
          {idx < HOW_ITEMS.length - 1 && (
            <ArrowDown className="hidden sm:block absolute top-8 -right-3 w-5 h-5
              text-muted-foreground/40 rotate-[-90deg] z-10 bg-background" />
          )}
        </div>
      ))}
    </div>
  </section>
);

// ─── Stats Row ────────────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Destinasi' },
  { value: 'AI',   label: 'Powered'   },
  { value: '100%', label: 'Terverifikasi' },
  { value: '24/7', label: 'Dukungan'  },
];

const StatsRow = () => (
  <div className="flex flex-wrap items-center justify-center sm:justify-between
    gap-y-5 gap-x-0 border-y border-border py-6 sm:py-8">
    {STATS.map(({ value, label }, i) => (
      <div key={label} className="flex items-center">
        {i > 0 && (
          <span className="hidden sm:block w-px h-8 bg-border mx-8 shrink-0" />
        )}
        <div className="text-center sm:text-left px-6 sm:px-0">
          <p className="font-serif italic font-bold text-2xl sm:text-3xl text-travia-orange leading-none">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
        </div>
      </div>
    ))}
  </div>
);

// ─── HomePage ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { data: banners = [], isLoading: bannersLoading } = useBanners();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14 sm:space-y-20 pb-12">

      <HeroSection />

      {bannersLoading ? (
        <div className="w-full aspect-[21/7] sm:aspect-[21/6] lg:aspect-[21/5]
          rounded-2xl bg-muted animate-pulse" />
      ) : (
        <BannerCarousel banners={banners} />
      )}

      <StatsRow />

      <ProductSection />

      <HowItWorks />

    </div>
  );
};

export default HomePage;
