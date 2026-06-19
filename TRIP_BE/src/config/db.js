import mongoose from 'mongoose';
import dns      from 'node:dns';

// Fix querySrv ECONNREFUSED: c-ares (DNS resolver Node) kadang membaca DNS server
// loopback (127.0.0.1 / ::1) yang tidak ada listener-nya — sisa dari VPN/Docker/WSL.
// Akibatnya resolve SRV record `mongodb+srv://` gagal.
const isLoopback = (s) => s.startsWith('127.') || s === '::1';
const dnsServers = dns.getServers();
if (dnsServers.length === 0 || dnsServers.every(isLoopback)) {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.URI, {
      bufferCommands: false,
    }).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

export default connectDB;
