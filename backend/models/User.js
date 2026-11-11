import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    headline: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 2000 },
    location: { type: String, default: '' },
    avatar: { type: String, default: '' },
    coverPhoto: { type: String, default: '' },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    skills: [{ type: String, trim: true }],
    refreshSessions: { type: [{ sessionId: String, tokenHash: String, expiresAt: Date }], select: false, default: [] },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// REMOVED: userSchema.index({ email: 1 }); -> Handled automatically by unique: true!
userSchema.index({ company: 1, firstName: 1, lastName: 1 });
userSchema.index({ firstName: 'text', lastName: 'text', headline: 'text' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  // If the password wasn't explicitly selected in the controller, this fallback check prevents crashes
  if (!this.password) {
    throw new Error('Password field must be explicitly selected using .select("+password") in the controller before verification.');
  }
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    headline: this.headline,
    bio: this.bio,
    location: this.location,
    avatar: this.avatar,
    coverPhoto: this.coverPhoto,
    company: this.company,
    role: this.role,
    skills: this.skills,
    connectionCount: this.connections?.length || 0,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;