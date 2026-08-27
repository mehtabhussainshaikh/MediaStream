import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_document, value) {
      delete value.passwordHash;
      return value;
    },
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

