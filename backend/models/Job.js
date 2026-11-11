import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: 'Remote' },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      default: 'full-time',
    },
    description: { type: String, required: true, maxlength: 5000 },
    salary: { type: String, default: '' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ isActive: 1, type: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
export default Job;
