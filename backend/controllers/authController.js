import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { startSession, hashToken, makeTokens, setSessionCookies, clearSessionCookies } from '../services/session.js';
export const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account already uses this email. Please sign in.' });
  const user = await User.create({ firstName, lastName, email, password });
  await startSession(user, res);
  res.status(201).json(user.toPublicProfile());
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshSessions');
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'The email or password is incorrect.' });
  await startSession(user, res);
  res.json(user.toPublicProfile());
};
export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new Error('Missing refresh cookie');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    const tokens = makeTokens(decoded.id, decoded.sessionId);
    const user = await User.findOneAndUpdate({ _id: decoded.id, refreshSessions: { $elemMatch: { sessionId: decoded.sessionId, tokenHash: hashToken(token), expiresAt: { $gt: new Date() } } } }, { $set: { 'refreshSessions.$.tokenHash': hashToken(tokens.refreshToken), 'refreshSessions.$.expiresAt': new Date(Date.now() + 7 * 86400000) } }, { new: true });
    if (!user) throw new Error('Session expired');
    setSessionCookies(res, tokens);
    res.json(user.toPublicProfile());
  } catch (err) {
    if (err.name === 'MongoServerError' || err.name === 'MongooseError') throw err;
    clearSessionCookies(res);
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
};
export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type === 'refresh') await User.updateOne({ _id: decoded.id }, { $pull: { refreshSessions: { sessionId: decoded.sessionId } } });
    } catch (err) {
      if (!['JsonWebTokenError', 'TokenExpiredError'].includes(err.name)) throw err;
    }
  }
  clearSessionCookies(res);
  res.json({ message: 'Signed out' });
};
export const getMe = async (req, res) => res.json(req.user.toPublicProfile());
