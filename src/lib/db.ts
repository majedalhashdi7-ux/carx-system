// CAR X - اتصال قاعدة البيانات carx_production
import mongoose from 'mongoose';

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCarX: CachedConnection;
}

const cached: CachedConnection = global.mongooseCarX || { conn: null, promise: null };
global.mongooseCarX = cached;

export async function connectDB(): Promise<typeof mongoose> {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_CARX || '';

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 25,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      retryWrites: true,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((m) => {
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
