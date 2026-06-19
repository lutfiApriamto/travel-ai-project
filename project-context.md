# Project Context: AI Travel Agent Recommendation App

## Latar Belakang & Tujuan Strategis

Dibuat sebagai proof-of-work selama menunggu hasil interview Fullstack Developer di **Panorama JTB** (interview 12 Juni 2026, estimasi balasan HR maksimal 2 minggu, masih pending).

Saat interview, terjadi diskusi mendalam soal penggunaan AI — mulai dari penggunaan sehari-hari, implementasi, hingga pembuatan model — karena user (calon atasan/tim) sedang ingin membangun aplikasi berbasis AI. Sayangnya obrolan terpotong dan proses interview dihentikan sebelum tuntas.

**Strategi:** Membangun aplikasi dengan tema yang related (tapi tidak langsung mengklaim terafiliasi) dengan industri travel agent — sesuai bidang Panorama Group — sebagai sinyal konkret kemampuan AI engineering ke calon perusahaan, sambil menunggu hasil interview.

**Konstrain:**
- Timeline: 1 minggu (sprint, MVP kecil)
- Posisi yang dilamar: **Fullstack Developer** (bukan ML Engineer) — ini penting untuk framing scope project
- Developer (Lutfi) belum familiar dengan cara deploy/serving model ML sendiri ke production — sehingga model custom (training + deployment) **sengaja di-drop dari scope**, fokus penuh ke **Applied AI Engineering**: prompt engineering, structured output, multi-turn conversation, state management

---

## Riset Awal: Masalah Dataset (Dead End — Penting untuk Konteks)

Eksplorasi awal mempertimbangkan pendekatan "Destination Vibe Classifier" — model klasifikasi teks (Naive Bayes, sesuai pengalaman developer di skripsi sebelumnya: prediksi harga properti Jabodetabek) untuk mengkategorikan destinasi wisata berdasarkan review jadi vibe (family-friendly, romantic, adventure, dll).

**Riset dataset di Kaggle menemukan:**
- Dataset **"Indonesia Tourism Destination" (by aprabowo)** — ~400 destinasi di 5 kota besar (Jakarta, Yogyakarta, Semarang, Bandung, Surabaya), terdiri dari `tourism_with_id.csv`, `user.csv`, `tourism_rating.csv`, `package_tourism.csv`. **Masalah: tidak ada kolom teks review, hanya rating numerik 1-5.** Sudah ada kategori predefined (Budaya, Cagar Alam, Bahari, Taman Hiburan, dll) tapi ini metadata, bukan teks bebas.
- Dataset **"Travel Review Rating Dataset"** — juga rating-based/clustering-oriented, bukan text classification.
- **Kesimpulan:** Tidak ditemukan dataset siap-pakai berisi teks review + label vibe yang sesuai kebutuhan. Opsi yang sempat dipertimbangkan: synthetic data generation via LLM (generate review sintetis berdasarkan deskripsi resmi destinasi). Opsi ini **tidak dilanjutkan** karena keputusan strategis berikutnya (lihat bawah).

---

## Keputusan Final: Pivot Strategi (Ide dari Developer Sendiri)

Developer mengusulkan pendekatan yang lebih baik dan akhirnya disepakati sebagai arah final:

**Alih-alih** bergantung pada dataset destinasi wisata eksternal (yang ternyata bermasalah ketersediaannya) dan membangun model ML custom (yang developer belum kuasai deployment-nya),

**Pendekatan baru:**
1. Developer berperan sebagai **pelaku usaha travel agent fiktif** dengan katalog produk trip yang dibuat sendiri (full ownership atas data — tidak bergantung sumber eksternal)
2. AI **tidak melakukan klasifikasi/training model**, melainkan **rekomendasi berbasis reasoning** dari conversational input user
3. User melakukan prompting bebas (tipe liburan yang diinginkan, budget, dll), lalu AI menganalisis dan merekomendasikan kategori/paket trip yang paling sesuai dari katalog yang sudah didefinisikan

### 10 Kategori Produk Trip (Katalog yang Dibuat Developer)

1. Private Trip (Tour Pribadi)
2. Solo Traveling (Trip Sendirian)
3. FIT (Free Independent Traveler) / Backpacking
4. Flashpacking
5. Corporate / Incentive Trip (Trip Kantor)
6. Staycation
7. Honeymoon Trip
8. Open Trip
9. Luar Negeri Trip
10. (kategori lain dapat ditambahkan)

**Kenapa pendekatan ini lebih baik:**
- Taksonomi 10 kategori ini adalah kategori **nyata yang dipakai industri travel agent profesional** — bukan kategori "wisata generik". Ini menunjukkan riset domain bisnis yang align dengan industri Panorama.
- Karena data dikontrol sendiri, masalah ketersediaan dataset eksternal jadi tidak relevan.
- Drop model training/deployment adalah keputusan **jujur dan defensible** — daripada memaksa scope yang belum dikuasai, fokus penuh ke kekuatan yang nyata (fullstack + prompt engineering), yang juga align dengan posisi yang dilamar (fullstack, bukan ML engineer).

---

## Konsep Aplikasi: "TripSense" (nama sementara)

### Fitur MVP (Wajib, untuk demo)

**1. Conversational Trip Planner / Recommender**
- User chat bebas (bukan form kaku) tentang preferensi liburan: budget, jumlah orang, tujuan trip, vibe yang diinginkan
- Sistem mem-parsing chat via LLM (OpenAI/Gemini API) dengan **system prompt terstruktur** yang mem-paksa LLM mengekstrak entitas penting sebagai **structured output (JSON)**, bukan teks bebas — supaya frontend bisa render otomatis jadi card
- Dari structured output ini, sistem (atau LLM, dengan prompt yang tepat) menentukan kategori trip (dari 10 kategori) yang paling sesuai, lengkap dengan alasan rekomendasinya
- User bisa lanjut refine via chat lanjutan (misal "ganti yang lebih murah") tanpa harus mengulang dari nol — disebut juga "re-roll" parsial

**2. Signal Extraction Logic (inti dari "kecerdasan" AI di app ini)**
Ini bagian paling kritis untuk membuktikan AI benar-benar "reasoning", bukan cuma dropdown filter berbungkus chat. Signal yang perlu diekstrak dari natural language user:
- Jumlah orang yang ikut (1 = solo/FIT, banyak = open trip/corporate)
- Budget per orang (rendah = backpacking/flashpacking, tinggi = private/honeymoon)
- Tujuan/motivasi trip (kerja = corporate, romantis = honeymoon, privasi = private trip)
- Tingkat kenyamanan yang diinginkan (mager = staycation/flashpacking, niat explore = FIT/backpacking)
- **Kemampuan handle ambiguitas** adalah pembeda kunci — contoh kasus uji: kalimat vague seperti "aku capek kerja, pengen healing tapi males ribet" harus bisa di-translate AI menjadi sinyal yang relevan (capek kerja = stress relief, males ribet = bukan FIT/backpacking → lebih cocok Staycation/Flashpacking)

**3. Itinerary / Recommendation Card View**
- Hasil rekomendasi ditampilkan sebagai card visual (bukan teks panjang), menampilkan: kategori trip, alasan match, estimasi budget, durasi tipikal
- Desain dark theme dengan accent color (sesuai preferensi desain developer)

**4. Budget Breakdown Sederhana**
- Estimasi alokasi budget (transport, akomodasi, makan, aktivitas) ditampilkan visual sederhana (donut/bar chart, bisa pakai Recharts)

### Fitur Nice-to-Have (jika waktu tersisa)
- Save/export rekomendasi jadi PDF
- "Re-roll" partial tanpa generate ulang semua
- Mini indicator "AI confidence" terhadap rekomendasi yang diberikan (transparency touch)

### Yang Sengaja Tidak Dimasukkan (di luar scope)
- Booking system, payment, multi-user auth kompleks — bukan fokus yang ingin ditunjukkan; jika ditanya, jawaban: scope sengaja difokuskan ke AI layer karena itu yang paling relevan dengan diskusi interview
- Model ML custom (training + deployment) — alasan: belum dikuasai deployment-nya, dan posisi yang dilamar adalah fullstack bukan ML engineer

---

## Tech Stack & Arsitektur (Diskusi Awal — Dapat Disesuaikan)

Karena developer sudah punya fondasi MERN + pengalaman Zustand/TanStack Query dari pengalaman internship (FRO MES di ParagonCorp), disarankan tetap di comfort zone ini untuk efisiensi waktu dalam sprint 1 minggu:

- **Frontend:** React + Tailwind CSS, Zustand (state chat history & rekomendasi), TanStack Query (request handling ke backend)
- **Backend:** Node.js + Express sebagai orchestrator — terima request dari frontend, panggil OpenAI/Gemini API untuk parsing intent & generate structured output, kembalikan hasil ke frontend
- **Database:** MongoDB — simpan katalog 10 kategori trip + atribut detailnya, opsional simpan history chat
- **AI Provider:** OpenAI API atau Gemini API (integrasi langsung, tanpa training model sendiri)

**Catatan:** Arsitektur ini adalah hasil diskusi sebelum pivot ke ide final developer. Karena model ML custom sudah di-drop dari scope, **tidak diperlukan lagi Python/FastAPI model service** yang sempat dibahas di iterasi sebelumnya — backend cukup Node/Express yang langsung orchestrate ke AI provider API.

---

## Hal yang Perlu Diperhatikan / Risiko (Per Diskusi Terakhir)

1. **Risiko terlihat dangkal:** Tanpa logic ekstraksi sinyal yang jelas, AI bisa terlihat seperti "if-else berbungkus chat". Mitigasi: desain multi-step reasoning di prompt (extract signal dulu sebagai structured JSON, baru tentukan kategori + alasan).

2. **Konsistensi struktur data katalog:** Karena data dibuat sendiri, perlu struktur yang rapi per kategori trip — minimal: nama paket, kategori, range budget, durasi tipikal, destinasi yang cocok, target audiens. Tanpa struktur ini, AI akan kesulitan memberi rekomendasi yang konsisten.

3. **Risiko "form berbaju AI":** Jika sistem cuma menjawab kategori berdasarkan input yang straightforward (budget + jumlah orang), secara fungsi itu sama saja dengan dropdown filter biasa. Yang harus dipertahankan adalah kemampuan handle ambiguitas dan bahasa natural yang vague.

4. **Antisipasi pertanyaan interview soal ML:** Karena tidak ada model training/deployment di project ini, perlu jawaban percaya diri (bukan defensif) jika ditanya — fokus project ini adalah Applied AI Engineering (prompt design, structured output, conversation state management) sebagai keputusan sadar yang align dengan posisi fullstack yang dilamar.

---

## Status Diskusi Saat Ini

Diskusi sudah mencapai tahap konsep matang dan keputusan strategi final (10 kategori trip + reasoning-based recommendation, tanpa model custom). **Belum dibahas secara detail:**
- Struktur data/schema lengkap untuk 10 kategori trip (atribut spesifik tiap kategori)
- Desain prompt engineering detail untuk signal extraction dari chat ke kategori
- Breakdown timeline harian (Day 1 - Day 7)
- Detail UI/UX flow tiap fitur
- Penamaan final aplikasi (saat ini masih working title "TripSense")

Dokumen ini dibuat untuk transfer knowledge ke sesi kerja berikutnya (Claude Code) agar pengembangan dapat dilanjutkan tanpa perlu re-explain konteks dari awal.
