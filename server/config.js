import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toynest',
  jwtSecret: process.env.JWT_SECRET || 'toynest-local-development-secret',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'ToyNest <no-reply@toynest.local>',
  upiId: process.env.UPI_ID || 'toynest@upi',
  merchantName: process.env.MERCHANT_NAME || 'ToyNest Store'
};
