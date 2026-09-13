import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['register', 'login'], required: true },
    expiresAt: { type: Date, required: true },
    verifiedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Otp', otpSchema);
