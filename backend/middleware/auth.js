import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const protect = async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') throw new Error('Wrong token type');
  } catch { return res.status(401).json({ message: 'Session expired. Please refresh your session.' }); }
  try {
    req.user = await User.findOne({ _id: decoded.id, refreshSessions: { $elemMatch: { sessionId: decoded.sessionId, expiresAt: { $gt: new Date() } } } });
    if (!req.user) return res.status(401).json({ message: 'Please sign in again.' });
    next();
  } catch (err) { next(err); }
};
