import { createClient } from 'redis';
let client;
const local = new Map();
const generationKey = 'pronet:feed:generation';
let localGeneration = 0;
export const initCache = async () => {
  if (!process.env.REDIS_URL) return;
  client = createClient({ url: process.env.REDIS_URL, disableOfflineQueue: true, socket: { connectTimeout: 1500, reconnectStrategy: false } });
  client.on('error', () => {});
  try { await client.connect(); } catch { client = undefined; console.warn('Redis unavailable: using local cache.'); }
};
export const closeCache = async () => { if (client?.isOpen) await client.quit(); local.clear(); };
export const cacheGet = async key => {
  if (client?.isReady) { try { const value = await client.get(key); return value ? JSON.parse(value) : null; } catch { /* fall back */ } }
  const entry = local.get(key);
  if (!entry || entry.expires <= Date.now()) { local.delete(key); return null; }
  return entry.value;
};
export const cacheSet = async (key,value,ttl=30) => {
  if (client?.isReady) { try { await client.set(key,JSON.stringify(value),{EX:ttl}); return; } catch { /* fall back */ } }
  // Bound process memory when many users request different pages.
  if (local.size >= 200) local.delete(local.keys().next().value);
  local.set(key,{value:JSON.parse(JSON.stringify(value)),expires:Date.now()+ttl*1000});
};
export const feedGeneration = async () => {
  if (client?.isReady) { try { return (await client.get(generationKey)) || '0'; } catch { /* fall back */ } }
  return String(localGeneration);
};
export const invalidateFeed = async () => {
  localGeneration++; local.clear();
  if (client?.isReady) { try { await client.incr(generationKey); } catch { /* TTL remains the fallback */ } }
};
export const cacheFeed = async (req,res,next) => {
  try {
    const generation = await feedGeneration();
    req.feedCacheKey = `pronet:feed:${generation}:${req.path}:${req.user._id}:${req.query.scope || 'all'}:${req.query.page || 1}:${req.query.limit || 10}`;
    const cached = await cacheGet(req.feedCacheKey);
    if (cached) return res.json(cached);
    next();
  } catch(err) { next(err); }
};
