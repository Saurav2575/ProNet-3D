import User from '../models/User.js';
import Post from '../models/Post.js';
import Connection from '../models/Connection.js';
import { invalidateFeed } from '../services/cache.js';
import { escapeRegex } from '../middleware/validate.js';

export const getProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user.toPublicProfile());
};

export const updateProfile = async (req, res) => {
  const allowed = [
    'firstName', 'lastName', 'headline', 'bio', 'location',
    'avatar', 'coverPhoto', 'company', 'role', 'skills',
  ];

  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  await invalidateFeed();
  res.json(user.toPublicProfile());
};

export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.json([]);
  }

  const regex = new RegExp(escapeRegex(q.trim()), 'i');
  const filter = { _id: { $ne: req.user._id }, $or: [{ firstName: regex }, { lastName: regex }, { headline: regex }, { company: regex }] };
  if (req.query.company) filter.company = req.query.company.trim();
  const users = await User.find(filter).sort({ firstName: 1, lastName: 1 }).limit(20).select('firstName lastName headline avatar company role');

  res.json(users);
};

export const getUserPosts = async (req, res) => {
  const posts = await Post.find({ author: req.params.id })
    .populate('author', 'firstName lastName avatar headline')
    .populate('comments.author', 'firstName lastName avatar')
    .limit(50)
    .sort({ createdAt: -1 });

  res.json(posts);
};

export const getSuggestions = async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const invites = await Connection.find({ $or: [{ requester: req.user._id }, { recipient: req.user._id }], status: { $in: ['pending', 'accepted'] } });
  const excludeIds = [req.user._id, ...(currentUser.connections || []), ...invites.flatMap(c => [c.requester, c.recipient])];

  const suggestions = await User.find({ _id: { $nin: excludeIds } })
    .limit(10)
    .select('firstName lastName headline avatar company role');

  res.json(suggestions);
};
