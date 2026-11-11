import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import app from './app.js';
import { initCache,closeCache } from './services/cache.js';
let server;
try{
  if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32) throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
  await connectDB();await initCache();
  server=app.listen(Number(process.env.PORT||5000),()=>console.log(`ProNet running on port ${process.env.PORT||5000}`));
}catch(err){console.error('Startup failed:',err.message);process.exitCode=1;}
const shutdown=async()=>{if(server) await new Promise(resolve=>server.close(resolve));await closeCache();await mongoose.disconnect();};
process.on('SIGINT',()=>shutdown().then(()=>process.exit(0)));
process.on('SIGTERM',()=>shutdown().then(()=>process.exit(0)));
