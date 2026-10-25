/** Creates (or resets) the demo account: `npm run seed`. */
import mongoose from 'mongoose';
import { env } from '../env';
import { connectMongo } from '../lib/db';
import { resetDemoData } from '../services/demo';

await connectMongo(env.MONGODB_URI);
const user = await resetDemoData();
console.log(`Demo account ready: ${user.email}`);
await mongoose.disconnect();
