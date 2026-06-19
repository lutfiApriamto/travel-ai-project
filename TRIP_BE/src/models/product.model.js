import mongoose from 'mongoose';

// Sub-schema itinerary per hari
const itineraryDaySchema = new mongoose.Schema(
  {
    day:        { type: Number, required: true },
    title:      { type: String, required: true, trim: true },
    activities: { type: String, required: true },
    hotel:      { type: String, default: null },
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch:     { type: Boolean, default: false },
      dinner:    { type: Boolean, default: false },
    },
  },
  { _id: false }
);

// Sub-schema add-on opsional
const addOnSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    // identifier unik di URL, auto-generate dari nama
    slug: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    // relasi many-to-many ke Category, Type, Tag
    // jika salah satu dihapus → entry di array ini otomatis dibersihkan
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    types:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Type' }],
    tags:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],

    shortDescription: {
      type:    String,
      default: null,
      trim:    true,
    },

    description: {
      type:    String,
      default: null,
    },

    // URL foto utama dari Supabase Storage
    thumbnail: {
      type:    String,
      default: null,
    },

    // array URL foto tambahan dari Supabase Storage
    gallery: [{ type: String }],

    departureCity: {
      type:    String,
      default: null,
      trim:    true,
    },

    // destinasi dalam Indonesia, bisa lebih dari satu kota/daerah
    destinations: [{ type: String, trim: true }],

    departureDate: {
      type:     Date,
      required: true,
    },

    returnDate: {
      type:     Date,
      required: true,
    },

    // "X Hari Y Malam" — disimpan sebagai string agar fleksibel
    duration: {
      type:    String,
      default: null,
    },

    meetingPoint: {
      type:    String,
      default: null,
      trim:    true,
    },

    price: {
      type:     Number,
      required: true,
      min:      0,
    },

    // kapasitas maksimal peserta
    quota: {
      type:     Number,
      required: true,
      min:      1,
    },

    // jumlah slot yang sudah terbooking (order berstatus paid)
    // bertambah saat payment sukses, berkurang saat refund diapprove
    bookedSlots: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // minimum peserta agar trip jalan (opsional)
    minParticipants: {
      type:    Number,
      default: null,
    },

    itinerary: [itineraryDaySchema],

    includes: [{ type: String, trim: true }],
    excludes: [{ type: String, trim: true }],

    addOns: [addOnSchema],

    terms: {
      type:    String,
      default: null,
    },

    status: {
      type:    String,
      enum:    ['draft', 'active', 'full', 'expired', 'cancelled'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
