import dns from 'node:dns';
import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Connects to MongoDB. Some home routers / ISPs can't resolve the SRV records
 * behind `mongodb+srv://` URIs; in that case retry once using public DNS.
 */
export const connectMongo = async (uri: string) => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  } catch (error) {
    const srvLookupFailed = error instanceof Error && /querySrv|ENOTFOUND|ECONNREFUSED/.test(error.message);
    if (!uri.startsWith('mongodb+srv://') || !srvLookupFailed) throw error;
    logger.warn('SRV lookup failed with the system DNS – retrying with public DNS servers');
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  }
};
