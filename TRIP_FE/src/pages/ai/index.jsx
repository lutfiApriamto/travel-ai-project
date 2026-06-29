import {
  useState, useEffect, useRef,
  useCallback, useMemo,
} from 'react';
import { Link, useBlocker }   from 'react-router-dom';
import { useQueries }         from '@tanstack/react-query';
import {
  Send, Sparkles, RefreshCw, AlertTriangle,
  Loader2, ChevronRight, Filter, LayoutGrid,
} from 'lucide-react';
import { cn }                 from '../../lib/utils.js';
import { ROUTES }             from '../../utils/consts/routes.js';
import api                    from '../../lib/axios.js';
import { useInfiniteProducts } from '../home/api/useHome.js';
import ProductCard, { ProductCardSkeleton } from '../home/components/ProductCard.jsx';
import { useAiChat }          from './api/useAiChat.js';

// ─── Client-side rate limit ───────────────────────────────────────────────────

const SESSION_LIMIT  = 30;
const SESSION_WINDOW = 60 * 60 * 1000; // 1 jam

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const buildHistory = (messages) =>
  messages
    .filter((m) => m.text && !m.isError)
    .map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.text }))
    .slice(-20);

// ─── Quick suggestions ────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  'Wisata Bali untuk keluarga, budget Rp 5 juta',
  'Paket honeymoon romantis yang terjangkau',
  'Trip solo ke Lombok 3 hari 2 malam',
  'Destinasi wisata yang sedang trending sekarang',
];

// ─── Leave Warning Modal ──────────────────────────────────────────────────────

const LeaveWarningModal = ({ isOpen, onStay, onLeave, isClearChat = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border
        rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40
            flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isClearChat ? 'Hapus Percakapan?' : 'Tinggalkan Percakapan?'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {isClearChat
                ? 'Semua pesan dan sesi akan direset. Produk kembali menampilkan semua paket.'
                : 'Percakapan akan hilang dan produk akan direset ke tampilan awal.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onStay}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
              text-foreground hover:bg-accent transition-colors">
            {isClearChat ? 'Batal' : 'Tetap di Sini'}
          </button>
          <button onClick={onLeave}
            className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white
              text-sm font-semibold transition-colors">
            {isClearChat ? 'Ya, Hapus' : 'Pergi'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Rate Limit Badge ─────────────────────────────────────────────────────────

const RateLimitBadge = ({ remaining }) => {
  const cls =
    remaining > 10 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50' :
    remaining > 4  ? 'text-amber-600  dark:text-amber-400  bg-amber-50  dark:bg-amber-950/40  border-amber-200  dark:border-amber-800/50' :
                     'text-red-600    dark:text-red-400    bg-red-50    dark:bg-red-950/40    border-red-200    dark:border-red-800/50';
  return (
    <span className={cn('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border', cls)}>
      <Sparkles className="w-3 h-3" />
      {remaining}/{SESSION_LIMIT} pesan
    </span>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="flex items-end gap-3">
    <div className="w-8 h-8 rounded-full bg-travia-orange/10 flex items-center
      justify-center text-travia-orange font-bold text-xs select-none shrink-0">
      AI
    </div>
    <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex items-end gap-3', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-travia-orange/10 flex items-center
          justify-center text-travia-orange font-bold text-xs select-none shrink-0">
          AI
        </div>
      )}
      <div className={cn('max-w-[75%] sm:max-w-[65%]', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
          isUser
            ? 'bg-travia-orange text-white rounded-br-sm'
            : msg.isError
              ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-bl-sm'
              : 'bg-background border border-border text-foreground rounded-bl-sm',
        )}>
          {msg.text}
        </div>
        <p className={cn('text-[10px] text-muted-foreground mt-1', isUser ? 'text-right' : 'text-left')}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
};

// ─── All Products Grid (Infinite Scroll) ──────────────────────────────────────

const AllProductsGrid = () => {
  const sentinelRef = useRef(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts({});

  const allProducts = useMemo(
    () => data?.pages.flatMap((p) => p.products) ?? [],
    [data],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {allProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`sk-${i}`} />)}
      </div>

      <div ref={sentinelRef} className="h-1 mt-6" aria-hidden="true" />

      {!hasNextPage && allProducts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Semua paket sudah ditampilkan · {allProducts.length} paket
        </p>
      )}
      {allProducts.length === 0 && !isLoading && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Belum ada produk tersedia
        </p>
      )}
    </>
  );
};

// ─── Filtered Products Grid ───────────────────────────────────────────────────

const FilteredProductsGrid = ({ productIds, onShowAll }) => {
  const queries = useQueries({
    queries: productIds.map((id) => ({
      queryKey:  ['product', id],
      queryFn:   () => api.get(`/products/${id}`).then((r) => r.data.data.data),
      staleTime: 5 * 60_000,
    })),
  });

  const products  = queries.filter((q) => q.data).map((q) => q.data);
  const isLoading = queries.some((q) => q.isLoading) && products.length === 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: productIds.length || 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Filter className="w-10 h-10 text-muted-foreground/20 mb-3" />
        <p className="font-semibold text-foreground mb-1 text-sm">
          Tidak ada produk ditemukan
        </p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          AI belum menemukan produk yang cocok. Lanjutkan percakapan untuk memperhalus.
        </p>
        <button onClick={onShowAll}
          className="text-xs text-travia-orange hover:underline flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5" />
          Lihat semua produk
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button onClick={onShowAll}
          className="text-sm text-muted-foreground hover:text-travia-orange
            transition-colors flex items-center gap-1">
          <ChevronRight className="w-4 h-4" />
          Lihat semua produk
        </button>
      </div>
    </>
  );
};

// ─── AiChatPage ───────────────────────────────────────────────────────────────

const AiChatPage = () => {
  const [messages,          setMessages]          = useState([]);
  const [input,             setInput]             = useState('');
  const [requestTimestamps, setRequestTimestamps] = useState([]);
  const [showClearConfirm,  setShowClearConfirm]  = useState(false);
  const [forceShowAll,      setForceShowAll]      = useState(false);
  const [chatHeight,        setChatHeight]        = useState(null); // null = pakai tinggi default responsif (CSS)

  const messagesContainerRef = useRef(null);
  const textareaRef          = useRef(null);
  const productRef           = useRef(null);
  const wasPendingRef        = useRef(false); // lacak transisi loading: true → false

  const aiChat = useAiChat();

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const recentRequests = useMemo(
    () => requestTimestamps.filter((t) => t > Date.now() - SESSION_WINDOW),
    [requestTimestamps],
  );
  const remaining    = SESSION_LIMIT - recentRequests.length;
  const rateLimitHit = remaining <= 0;

  const canSend =
    input.trim().length > 0 &&
    input.trim().length <= 1000 &&
    !aiChat.isPending &&
    !rateLimitHit;

  // ── Derived: latest AI response controls product section ──────────────────
  const latestAiResponse = useMemo(() => {
    const aiMsgs = messages.filter((m) => m.role === 'ai' && !m.isError);
    return aiMsgs.length > 0 ? aiMsgs[aiMsgs.length - 1] : null;
  }, [messages]);

  const effectiveResponse = forceShowAll ? null : latestAiResponse;
  const isFiltered = effectiveResponse && !effectiveResponse.showAll &&
    Array.isArray(effectiveResponse.recommendedProductIds) &&
    effectiveResponse.recommendedProductIds.length > 0;

  const hasConversation = messages.length > 0;

  // ── Block navigation ───────────────────────────────────────────────────────
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasConversation && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    const handler = (e) => {
      if (hasConversation) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasConversation]);

  // ── Auto-scroll dalam container chat (bukan scroll halaman) ───────────────
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, aiChat.isPending]);

  // ── (1) Auto-focus input saat halaman pertama dibuka ──────────────────────
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── (2) Kembalikan fokus ke input setelah AI selesai loading ──────────────
  // Hanya saat transisi pending true → false, dan input tidak sedang disabled.
  useEffect(() => {
    if (wasPendingRef.current && !aiChat.isPending && !rateLimitHit) {
      textareaRef.current?.focus();
    }
    wasPendingRef.current = aiChat.isPending;
  }, [aiChat.isPending, rateLimitHit]);

  // ── Scroll ke bagian produk HANYA saat AI punya rekomendasi spesifik ──────
  useEffect(() => {
    const hasRecommendations =
      latestAiResponse &&
      !latestAiResponse.isError &&
      !latestAiResponse.showAll &&
      Array.isArray(latestAiResponse.recommendedProductIds) &&
      latestAiResponse.recommendedProductIds.length > 0;

    if (!hasRecommendations) return;

    const t = setTimeout(() => {
      productRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
    return () => clearTimeout(t);
  }, [latestAiResponse]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    const trimmed = text?.trim() ?? input.trim();
    if (!trimmed || trimmed.length > 1000 || aiChat.isPending || rateLimitHit) return;

    setInput('');
    setForceShowAll(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: trimmed, timestamp: new Date() };
    const historySnapshot = buildHistory(messages);

    setMessages((prev) => [...prev, userMsg]);
    setRequestTimestamps((prev) => [
      ...prev.filter((t) => t > Date.now() - SESSION_WINDOW),
      Date.now(),
    ]);

    aiChat.mutate(
      { message: trimmed, conversationHistory: historySnapshot },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, {
            id:                    `a-${Date.now()}`,
            role:                  'ai',
            text:                  data.message ?? '',
            recommendedProductIds: Array.isArray(data.recommendedProductIds) ? data.recommendedProductIds : [],
            showAll:               data.showAll ?? true,
            timestamp:             new Date(),
          }]);
        },
        onError: (e) => {
          const status   = e.response?.status;
          const errText  =
            status === 429 ? 'Terlalu banyak permintaan. Silakan tunggu beberapa menit.' :
            status === 401 ? 'Sesi berakhir. Silakan login ulang.' :
                             'Asisten tidak tersedia. Silakan coba lagi.';
          setMessages((prev) => [...prev, {
            id: `e-${Date.now()}`, role: 'ai', text: errText, isError: true,
            timestamp: new Date(), recommendedProductIds: [], showAll: true,
          }]);
        },
      },
    );
  }, [input, messages, aiChat, rateLimitHit]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) sendMessage(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }
  };

  const handleClearConfirm = () => {
    setMessages([]);
    setRequestTimestamps([]);
    setShowClearConfirm(false);
    setInput('');
    setForceShowAll(false);
  };

  // ── (3) Resize tinggi area chat via drag handle ──────────────────────────
  // Pakai pointer events agar jalan di mouse maupun touch. Tinggi dibatasi
  // MIN dan MAX yang dihitung dari tinggi viewport → tetap responsif per device.
  const startResize = (e) => {
    e.preventDefault();
    const startY      = e.clientY;
    const startHeight = messagesContainerRef.current?.offsetHeight ?? 380;
    const MIN = 240;
    const MAX = Math.max(MIN, Math.round(window.innerHeight * 0.7));

    const onMove = (ev) => {
      const next = Math.min(MAX, Math.max(MIN, startHeight + (ev.clientY - startY)));
      setChatHeight(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  };

  const productSectionLabel = isFiltered
    ? `Rekomendasi AI · ${effectiveResponse.recommendedProductIds.length} paket`
    : 'Semua Paket Perjalanan';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* ── Chat Section ─────────────────────────────────────────────────── */}
        <section>
          {/* Section heading */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-travia-orange/10 flex items-center
                justify-center text-travia-orange">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-serif italic text-xl text-foreground leading-tight">
                  Travia AI
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Asisten perjalanan pintar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RateLimitBadge remaining={remaining} />
              {hasConversation && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  title="Hapus percakapan"
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                    text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Chat card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              className={cn(
                'overflow-y-auto px-4 sm:px-6 py-5 space-y-4',
                chatHeight == null && 'h-[320px] sm:h-[380px]', // default responsif sebelum di-resize
              )}
              style={chatHeight != null ? { height: chatHeight } : undefined}
            >
              {messages.length === 0 ? (
                /* Welcome */
                <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                  <div>
                    <p className="font-serif italic text-xl text-foreground mb-1.5">
                      Halo! Mau liburan ke mana? 👋
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      Ceritakan tujuan perjalananmu, anggaran, dan jumlah orang —
                      AI akan menyesuaikan paket yang paling cocok untukmu secara otomatis.
                    </p>
                  </div>

                  {/* Quick suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-sm px-4 py-3 rounded-xl border border-border
                          bg-background hover:border-travia-orange/50 hover:bg-travia-orange/5
                          text-muted-foreground hover:text-foreground transition-colors leading-snug"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              )}

              {aiChat.isPending && <TypingIndicator />}

              {rateLimitHit && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl
                  bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Batas sesi ({SESSION_LIMIT} pesan) tercapai. Muat ulang halaman untuk memulai sesi baru.
                  </p>
                </div>
              )}

              <div />
            </div>

            {/* Drag handle — tarik untuk ubah tinggi area chat (mouse & touch) */}
            <div
              onPointerDown={startResize}
              role="separator"
              aria-orientation="horizontal"
              aria-label="Tarik untuk mengubah tinggi area chat"
              title="Tarik untuk mengubah tinggi"
              className="group flex items-center justify-center h-3.5 cursor-row-resize
                border-t border-border bg-card/40 hover:bg-accent transition-colors
                select-none touch-none"
            >
              <div className="w-10 h-1 rounded-full bg-border
                group-hover:bg-muted-foreground/40 transition-colors" />
            </div>

            {/* Input area */}
            <div className="border-t border-border bg-background/60 px-4 sm:px-6 py-4">
              <div className={cn(
                'flex items-end gap-3 rounded-xl border transition-all duration-200',
                'bg-white dark:bg-travia-dark3 px-4 py-3',
                input.length > 0
                  ? 'border-travia-orange ring-2 ring-travia-orange/20'
                  : 'border-border',
              )}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    rateLimitHit
                      ? 'Batas sesi tercapai. Muat ulang untuk melanjutkan.'
                      : 'Ceritakan tujuan perjalananmu... (Enter untuk kirim, Shift+Enter baris baru)'
                  }
                  disabled={aiChat.isPending || rateLimitHit}
                  rows={1}
                  maxLength={1000}
                  className="flex-1 bg-transparent text-sm text-foreground
                    placeholder:text-muted-foreground resize-none focus:outline-none
                    disabled:opacity-50 leading-relaxed"
                  style={{ minHeight: '24px', maxHeight: '140px' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!canSend}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    canSend
                      ? 'bg-travia-orange text-white hover:bg-travia-orange/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed',
                  )}
                  aria-label="Kirim pesan"
                >
                  {aiChat.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <p className={cn(
                  'text-[11px]',
                  input.length > 900 ? 'text-amber-500 font-medium' : 'text-muted-foreground',
                )}>
                  {input.length}/1000
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Products Section ──────────────────────────────────────────────── */}
        <section ref={productRef}>
          {/* Section heading */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif italic text-xl sm:text-2xl text-foreground">
                {productSectionLabel}
              </h2>
              {isFiltered && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                  bg-travia-orange/10 text-travia-orange border border-travia-orange/20">
                  Dari AI
                </span>
              )}
            </div>

            {isFiltered && (
              <button
                onClick={() => setForceShowAll(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground
                  hover:text-travia-orange transition-colors"
              >
                Lihat Semua
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* AI filter banner */}
          {isFiltered && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-xl
              bg-travia-orange/5 border border-travia-orange/20">
              <Sparkles className="w-4 h-4 text-travia-orange shrink-0" />
              <p className="text-xs text-muted-foreground">
                Produk difilter berdasarkan percakapanmu.
                Ubah preferensi di chat untuk menyesuaikan tampilan produk.
              </p>
            </div>
          )}

          {/* Grid */}
          {isFiltered ? (
            <FilteredProductsGrid
              productIds={effectiveResponse.recommendedProductIds}
              onShowAll={() => setForceShowAll(true)}
            />
          ) : (
            <AllProductsGrid />
          )}
        </section>

      </div>

      {/* Modals */}
      <LeaveWarningModal
        isOpen={blocker.state === 'blocked'}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
        isClearChat={false}
      />
      <LeaveWarningModal
        isOpen={showClearConfirm}
        onStay={() => setShowClearConfirm(false)}
        onLeave={handleClearConfirm}
        isClearChat
      />
    </>
  );
};

export default AiChatPage;
