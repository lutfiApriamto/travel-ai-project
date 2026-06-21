import mongoose from 'mongoose';
import genAI    from '../../config/gemini.js';
import Product  from '../../models/product.model.js';

const MODEL       = 'gemini-1.5-flash';
const MAX_HISTORY = 10; // potong history ke N pesan terakhir sebelum dikirim ke Gemini

// ─── System Prompt ────────────────────────────────────────────────────────────

const buildSystemPrompt = (catalog) => `
Kamu adalah TripSense AI — asisten travel agent dari platform TripSense yang membantu pengguna menemukan paket wisata terbaik di Indonesia.

ATURAN WAJIB:
1. Kamu HANYA boleh membahas topik perjalanan wisata dan produk di platform TripSense. Jika ada pertanyaan di luar topik ini (misalnya coding, matematika, politik), tolak dengan sopan dan arahkan kembali ke topik perjalanan.
2. Kamu HARUS selalu membalas dalam Bahasa Indonesia, apapun bahasa yang digunakan pengguna.
3. Gali kebutuhan pengguna secara conversational terlebih dahulu (mood, budget, jumlah orang, preferensi destinasi, durasi, dll) sebelum merekomendasikan. Jangan langsung rekomendasikan di pesan pertama kecuali pengguna sudah memberikan cukup informasi.
4. Saat merekomendasikan produk, berikan alasan yang spesifik dan personal mengapa produk tersebut cocok untuk pengguna.
5. Kamu bisa menjelaskan detail atau itinerary produk secara conversational jika pengguna bertanya.
6. Bersikaplah hangat, antusias, dan seperti teman yang sedang membantu merencanakan liburan.

FORMAT RESPONSE (WAJIB — TANPA markdown, TANPA backtick, TANPA komentar):
{"message":"pesan balasanmu di sini","recommendedProductIds":[],"showAll":true}

ATURAN FIELD JSON:
- "message": teks percakapan yang ditampilkan ke pengguna. Boleh panjang, boleh gunakan emoji yang sesuai.
- "recommendedProductIds": array berisi _id produk yang direkomendasikan. Gunakan [] jika belum ada rekomendasi.
- "showAll": true jika belum punya cukup info untuk merekomendasikan (tampilkan semua produk di grid), false jika sudah ada rekomendasi spesifik.

KATALOG PRODUK AKTIF:
${JSON.stringify(catalog)}
`.trim();

// ─── Main chat handler ────────────────────────────────────────────────────────

export const chat = async ({ message, conversationHistory = [] }) => {
  // 1. Ambil katalog produk aktif — field minimal untuk hemat token
  const rawProducts = await Product.find({ status: 'active' })
    .select('_id name price departureDate destinations shortDescription quota bookedSlots')
    .populate('categories', 'name')
    .populate('types', 'name')
    .lean();

  const catalog = rawProducts.map((p) => ({
    _id:              p._id,
    name:             p.name,
    categories:       (p.categories || []).map((c) => c.name),
    types:            (p.types || []).map((t) => t.name),
    price:            p.price,
    departureDate:    p.departureDate,
    destinations:     p.destinations,
    shortDescription: p.shortDescription,
    availableSlots:   (p.quota || 0) - (p.bookedSlots || 0),
  }));

  // 2. Potong history ke maks MAX_HISTORY pesan terakhir
  const trimmedHistory = conversationHistory.slice(-MAX_HISTORY);

  // 3. Format history ke struktur Gemini contents
  const contents = [
    ...trimmedHistory.map((h) => ({
      role:  h.role,
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  // 4. Panggil Gemini — fallback jika error agar frontend tidak crash
  let parsed;
  try {
    const response = await genAI.models.generateContent({
      model:    MODEL,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(catalog),
        responseMimeType:  'application/json',
      },
    });

    // Defensive access — response.text bisa throw jika response blocked/empty
    let rawText;
    try {
      rawText = response.text;
    } catch {
      rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!rawText) {
      throw new Error('Gemini response kosong atau diblokir');
    }

    parsed = JSON.parse(rawText);
  } catch (err) {
    console.error('[AI] Gemini error:', err.message);
    console.error('[AI] Pastikan GEMINI_API_KEY sudah diisi di file .env backend');
    return {
      message:               'Maaf, asisten sedang sibuk. Silakan coba lagi dalam beberapa saat. 🙏',
      recommendedProductIds: [],
      showAll:               true,
    };
  }

  // 5. Validasi setiap product ID dari Gemini ke DB (antisipasi hallucination)
  const rawIds       = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];
  const validObjIds  = rawIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  let validatedIds = [];
  if (validObjIds.length > 0) {
    const found  = await Product.find({ _id: { $in: validObjIds }, status: 'active' }, '_id').lean();
    validatedIds = found.map((p) => p._id.toString());
  }

  // Jika semua ID hallucinated → paksa showAll true agar grid tidak kosong
  const showAll = validatedIds.length === 0 ? true : Boolean(parsed.showAll ?? false);

  return {
    message:               parsed.message ?? '',
    recommendedProductIds: validatedIds,
    showAll,
  };
};
