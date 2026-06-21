import { Link }           from 'react-router-dom';
import { ArrowRight, Shield, Sparkles, Clock } from 'lucide-react';
import { ROUTES }         from '../../utils/consts/routes.js';
import { useBanners }     from './api/useHome.js';
import BannerCarousel     from './components/BannerCarousel.jsx';
import ProductSection     from './components/ProductSection.jsx';

// ─── Trust Bar ────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { value: '500+',   label: 'Destinasi Tersedia'       },
  { value: 'AI',     label: 'Rekomendasi Cerdas'       },
  { value: '100%',   label: 'Paket Terverifikasi'      },
  { value: '24/7',   label: 'Dukungan Perjalanan'      },
];

const TrustBar = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6
    border-y border-border">
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

// ─── AI Chat CTA ──────────────────────────────────────────────────────────────

const AiChatCta = () => (
  <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br
    from-travia-orange to-amber-500 px-6 sm:px-12 py-12 sm:py-16 text-white">
    {/* Decorative blobs */}
    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full
      bg-white/10 blur-2xl pointer-events-none" />
    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full
      bg-black/10 blur-xl pointer-events-none" />

    <div className="relative max-w-2xl">
      {/* Fake chat bubbles */}
      <div className="flex flex-col gap-2 mb-7 max-w-sm">
        <div className="self-start bg-white/20 backdrop-blur-sm rounded-2xl rounded-tl-sm
          px-4 py-2.5 text-sm font-medium">
          Saya mau liburan ke Bali bulan depan untuk 2 orang...
        </div>
        <div className="self-end bg-white text-travia-orange rounded-2xl rounded-tr-sm
          px-4 py-2.5 text-sm font-semibold max-w-[260px]">
          Temukan rekomendasi terbaik untukmu sekarang!
        </div>
      </div>

      <h2 className="font-serif italic text-2xl sm:text-4xl font-bold mb-3 leading-tight">
        Ceritakan Perjalanan<br className="hidden sm:block" /> Impianmu
      </h2>
      <p className="text-white/80 text-sm sm:text-base mb-7 max-w-lg leading-relaxed">
        Ngobrol langsung dengan Travia AI — deskripsikan tujuan, anggaran, dan keinginanmu,
        dan biarkan AI menemukan paket yang paling pas untukmu.
      </p>

      <Link
        to={ROUTES.AI}
        className="inline-flex items-center gap-2 h-11 px-7 rounded-full
          bg-white text-travia-orange font-semibold text-sm
          hover:bg-white/90 transition-colors shadow-lg"
      >
        Mulai Ngobrol dengan AI
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </section>
);

// ─── HomePage ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { data: banners = [], isLoading: bannersLoading } = useBanners();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-14 sm:space-y-20">

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

      {/* AI Chat CTA */}
      <AiChatCta />

    </div>
  );
};

export default HomePage;
