import rateLimit from 'express-rate-limit';
export const createLimiter = ({ max, windowMs = 15 * 60 * 1000, message }) => rateLimit({ windowMs, max, standardHeaders: 'draft-7', legacyHeaders: false, message: { message }, skip: req => req.method === 'OPTIONS' });
export const apiLimiter = createLimiter({ max: Number(process.env.API_RATE_LIMIT || 300), message: 'Too many requests. Please try again later.' });
export const authLimiter = createLimiter({ max: Number(process.env.AUTH_RATE_LIMIT || 30), message: 'Too many sign-in attempts. Please wait before trying again.' });
