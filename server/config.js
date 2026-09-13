import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toynest',
  jwtSecret: process.env.JWT_SECRET || 'toynest-placement-secret-key-2026',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: process.env.SMTP_PORT || 465,
  smtpUser: process.env.SMTP_USER || 'sivaprashathsivaprashath74@gmail.com',
  smtpPass: process.env.SMTP_PASS || 'mgjolbkabnkafmbe',
  smtpFrom: process.env.SMTP_FROM || 'ToyNest <sivaprashathsivaprashath74@gmail.com>',
  upiId: process.env.UPI_ID || 'toynest@upi',
  merchantName: process.env.MERCHANT_NAME || 'ToyNest Store'
};
