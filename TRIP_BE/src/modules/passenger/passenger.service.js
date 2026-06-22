import Passenger from '../../models/passenger.model.js';

export const getMyPassengers = async (userId) =>
  Passenger.find({ userId }).sort({ createdAt: -1 }).lean();

export const upsertPassenger = async (userId, { nik, name, age, email }) => {
  // Jika NIK sudah tersimpan untuk user ini, update data lainnya
  // Jika belum, buat baru
  return Passenger.findOneAndUpdate(
    { userId, nik },
    { name, age, email: email.toLowerCase() },
    { upsert: true, new: true, runValidators: true }
  );
};

export const deletePassenger = async (id, userId) => {
  const p = await Passenger.findOneAndDelete({ _id: id, userId });
  if (!p) {
    const err = new Error('Data penumpang tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
};
