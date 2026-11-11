import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api' });
export const clearSessionCookies = res => {
  res.clearCookie('accessToken', cookieOptions());
  res.clearCookie('refreshToken', cookieOptions());
};
export const makeTokens = (userId, sessionId) => {
  const accessToken = jwt.sign({ id: String(userId), type: 'access', sessionId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: String(userId), type: 'refresh', sessionId, nonce: randomBytes(16).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
export const setSessionCookies = (res, tokens) => {
  res.cookie('accessToken', tokens.accessToken, { ...cookieOptions(), maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions(), maxAge: 7 * 86400000 });
};
export const startSession = async (user, res) => {
  const sessionId = randomBytes(24).toString('hex');
  const tokens = makeTokens(user._id, sessionId);
  // Atomic insertion keeps simultaneous sign-ins from overwriting one another.
  await user.constructor.updateOne({ _id: user._id }, { $pull: { refreshSessions: { expiresAt: { $lte: new Date() } } } });
  await user.constructor.updateOne({ _id: user._id }, { $push: { refreshSessions: { $each: [{ sessionId, tokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(Date.now() + 7 * 86400000) }], $slice: -10 } } });
  setSessionCookies(res, tokens);
};
