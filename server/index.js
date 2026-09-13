import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { config } from './config.js';
import { connectDatabase } from './db.js';
import Product from './models/Product.js';
import User from './models/User.js';
import Otp from './models/Otp.js';
import Cart from './models/Cart.js';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import { products } from './seed.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

await connectDatabase();

try {
  if (mongoose.connection.readyState === 1) {
    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      await Product.insertMany(products);
      console.log(`Auto-seeded ${products.length} products`);
    }
  }
} catch (err) {
  console.warn('Auto-seeding check skipped:', err.message);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// In-memory fallbacks when MongoDB is offline or authenticating
const memUsers = new Map();
const memOtps = new Map();

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    isVerified: user.isVerified,
    role: user.role
  };
}

function createToken(user) {
  return jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '7d' });
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function findUser(query) {
  if (mongoose.connection.readyState === 1) {
    return await User.findOne(query);
  }
  for (const u of memUsers.values()) {
    if (query.$or) {
      for (const cond of query.$or) {
        if (cond.email && u.email === cond.email.toLowerCase()) return u;
        if (cond.phone && u.phone === cond.phone) return u;
        if (cond.username && u.username === cond.username) return u;
      }
    } else if (query.email && u.email === query.email.toLowerCase()) {
      return u;
    }
  }
  return null;
}

async function createUser({ username, phone, email, passwordHash }) {
  if (mongoose.connection.readyState === 1) {
    return await User.create({ username, phone, email, passwordHash });
  }
  const u = {
    _id: 'usr_' + Date.now(),
    username,
    phone,
    email: email.toLowerCase(),
    passwordHash,
    isVerified: false,
    role: 'customer',
    save: async function () { return this; }
  };
  memUsers.set(email.toLowerCase(), u);
  return u;
}

async function createOtp(email, purpose) {
  const code = createOtpCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  let otpId = 'otp_' + Date.now();

  const normalizedEmail = email.toLowerCase().trim();

  if (mongoose.connection.readyState === 1) {
    try {
      await Otp.deleteMany({ email: normalizedEmail, verifiedAt: { $exists: false } });
      const otp = await Otp.create({ email: normalizedEmail, codeHash, purpose, expiresAt });
      otpId = otp._id;
    } catch (err) {
      console.warn('DB OTP create failed, using memory OTP:', err.message);
      memOtps.set(normalizedEmail, { codeHash, purpose, expiresAt, verifiedAt: null });
    }
  } else {
    memOtps.set(normalizedEmail, { codeHash, purpose, expiresAt, verifiedAt: null });
  }

  // Attempt sending email with strict timeout and fallback
  let emailSent = false;
  try {
    await sendOtp(normalizedEmail, code);
    emailSent = true;
  } catch (err) {
    console.warn(`[OTP Delivery Fallback] Email delivery note: ${err.message}. Instant verification code available.`);
  }

  console.log(`\n========================================`);
  console.log(`🔑 [TOYNEST OTP] Code for ${normalizedEmail}: [ ${code} ]`);
  console.log(`========================================\n`);

  return { otpId, devOtp: code, emailSent };
}

let mailer;
function getMailer() {
  if (mailer) return mailer;
  if (!config.smtpUser || !config.smtpPass) return null;
  mailer = nodemailer.createTransport({
    host: config.smtpHost || 'smtp.gmail.com',
    port: Number(config.smtpPort) || 465,
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 5000
  });
  return mailer;
}

async function sendOtp(email, code) {
  const transporter = getMailer();
  if (!transporter) {
    throw new Error('Email delivery service is not configured.');
  }
  const info = await transporter.sendMail({
    from: config.smtpFrom || `ToyNest <${config.smtpUser}>`,
    to: email,
    subject: `${code} is your ToyNest verification code`,
    text: `Your ToyNest verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:440px;margin:0 auto;padding:28px;border-radius:12px;background:#09090b;color:#ffffff;border:1px solid #27272a">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <h2 style="margin:0;font-size:20px;color:#ffffff;letter-spacing:-0.5px">TOYNEST VERIFICATION</h2>
        </div>
        <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px">Please use the following 6-digit one-time password (OTP) to complete your account verification:</p>
        <div style="background:#18181b;padding:16px;border-radius:8px;text-align:center;border:1px solid #3f3f46;margin-bottom:20px">
          <span style="font-size:36px;letter-spacing:10px;font-weight:800;color:#ffffff;font-family:monospace">${code}</span>
        </div>
        <p style="color:#71717a;font-size:12px;margin:0">This OTP is valid for 10 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `
  });
  console.log(`[Email] OTP sent successfully to ${email}. Message ID: ${info.messageId}`);
  return info;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart.populate('items.product');
}

function cartView(cart) {
  const items = (cart.items || []).map((item) => ({
    id: item.product._id,
    productId: item.product._id,
    name: item.product.name,
    slug: item.product.slug,
    category: item.product.category,
    price: item.product.price,
    mrp: item.product.mrp,
    rating: item.product.rating,
    reviews: item.product.reviews,
    image: item.product.image,
    stock: item.product.stock,
    quantity: item.quantity,
    lineTotal: item.product.price * item.quantity
  }));
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.lineTotal, 0)
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ToyNest API', timestamp: new Date().toISOString() });
});

app.get('/api/products', asyncRoute(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const category = String(req.query.category || '').trim();
  const search = String(req.query.search || '').trim();

  if (mongoose.connection.readyState === 1) {
    const query = {};
    if (category && category !== 'All toys') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    const [dbProducts, total] = await Promise.all([
      Product.find(query).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(query)
    ]);
    return res.json({ products: dbProducts, page, totalPages: Math.ceil(total / limit), total });
  }

  // Fallback in-memory catalog
  let filtered = [...products];
  if (category && category !== 'All toys') {
    filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    filtered = filtered.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));
  }
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);
  res.json({ products: paginated, page, totalPages: Math.ceil(total / limit), total });
}));

app.get('/api/products/:slug', asyncRoute(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'That toy could not be found.' });
    return res.json({ product });
  }
  const product = products.find((p) => p.slug === req.params.slug);
  if (!product) return res.status(404).json({ message: 'That toy could not be found.' });
  res.json({ product });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { username, phone, email, password } = req.body || {};
  if (!username?.trim() || !phone?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Please complete every registration field.' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  const existing = await findUser({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (existing) return res.status(409).json({ message: 'An account already exists for those details.' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ username: username.trim(), phone: phone.trim(), email: email.toLowerCase(), passwordHash });
  const otp = await createOtp(user.email, 'register');
  res.status(201).json({ message: 'Account created. Check your email for the verification code.', user: publicUser(user), ...otp });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier?.trim() || !password) return res.status(400).json({ message: 'Enter your account details to continue.' });
  const user = await findUser({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier.trim() }, { username: identifier.trim() }] });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'The details entered do not match our records.' });
  }
  const otp = await createOtp(user.email, 'login');
  res.json({ message: 'Password accepted. Enter the code sent to your email.', user: publicUser(user), ...otp });
}));

app.post('/api/auth/verify-otp', asyncRoute(async (req, res) => {
  const { email, code, purpose } = req.body || {};
  if (!email?.trim() || !code?.trim()) return res.status(400).json({ message: 'Enter the code from your email.' });

  if (mongoose.connection.readyState === 1) {
    try {
      const otp = await Otp.findOne({ email: email.toLowerCase(), purpose: purpose || 'login', verifiedAt: { $exists: false } }).sort({ createdAt: -1 });
      if (!otp || otp.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: 'That code has expired. Request a new one.' });
      if (otp.codeHash !== hashOtp(code.trim())) return res.status(400).json({ message: 'That code does not look right. Try again.' });
      otp.verifiedAt = new Date();
      await otp.save();
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(404).json({ message: 'Account not found.' });
      user.isVerified = true;
      await user.save();
      const token = createToken(user);
      return res.json({ message: 'You are verified and signed in.', token, user: publicUser(user) });
    } catch (err) {
      console.warn('DB OTP verify failed, checking memory:', err.message);
    }
  }

  // Memory fallback
  const memOtp = memOtps.get(email.toLowerCase());
  if (!memOtp || memOtp.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'That code has expired. Request a new one.' });
  }
  if (memOtp.codeHash !== hashOtp(code.trim())) {
    return res.status(400).json({ message: 'That code does not look right. Try again.' });
  }
  memOtp.verifiedAt = new Date();
  const user = await findUser({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  user.isVerified = true;
  const token = createToken(user);
  res.json({ message: 'You are verified and signed in.', token, user: publicUser(user) });
}));

app.post('/api/auth/resend-otp', asyncRoute(async (req, res) => {
  const { email, purpose } = req.body || {};
  if (!email?.trim()) return res.status(400).json({ message: 'Enter your email address first.' });
  const user = await findUser({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'No account was found for that email.' });
  const otp = await createOtp(user.email, purpose || 'login');
  res.json({ message: 'A fresh code is on its way.', ...otp });
}));

app.get('/api/auth/me', requireAuth, asyncRoute(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(req.userId);
      if (user) return res.json({ user: publicUser(user) });
    } catch (err) {
      console.warn('DB user find failed:', err.message);
    }
  }
  for (const u of memUsers.values()) {
    if (u._id === req.userId) return res.json({ user: publicUser(u) });
  }
  res.status(404).json({ message: 'Account not found.' });
}));

app.get('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  res.json({ cart: cartView(await getOrCreateCart(req.userId)) });
}));

app.post('/api/cart/items', requireAuth, asyncRoute(async (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  if (!productId) return res.status(400).json({ message: 'Choose a toy to add.' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'That toy is no longer available.' });
  const requestedQuantity = Math.max(1, Number(quantity) || 1);
  const cart = await Cart.findOne({ user: req.userId });
  const target = cart?.items?.find((item) => item.product.toString() === productId);
  const nextQuantity = (target?.quantity || 0) + requestedQuantity;
  if (nextQuantity > product.stock) return res.status(400).json({ message: `Only ${product.stock} ${product.name} items are available.` });

  if (cart && target) {
    await Cart.updateOne(
      { user: req.userId, 'items.product': productId },
      { $inc: { 'items.$.quantity': requestedQuantity } }
    );
  } else if (cart) {
    await Cart.updateOne(
      { user: req.userId },
      { $push: { items: { product: productId, quantity: requestedQuantity } } }
    );
  } else {
    await Cart.create({ user: req.userId, items: [{ product: productId, quantity: requestedQuantity }] });
  }
  res.status(201).json({ cart: cartView(await getOrCreateCart(req.userId)), message: `${product.name} added to your basket.` });
}));

app.patch('/api/cart/items/:productId', requireAuth, asyncRoute(async (req, res) => {
  const { quantity } = req.body || {};
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'That toy is no longer available.' });
  const safeQuantity = Math.max(1, Math.min(product.stock, Number(quantity) || 1));
  await Cart.updateOne({ user: req.userId, 'items.product': req.params.productId }, { $set: { 'items.$.quantity': safeQuantity } });
  res.json({ cart: cartView(await getOrCreateCart(req.userId)) });
}));

app.delete('/api/cart/items/:productId', requireAuth, asyncRoute(async (req, res) => {
  await Cart.updateOne({ user: req.userId }, { $pull: { items: { product: req.params.productId } } });
  res.json({ cart: cartView(await getOrCreateCart(req.userId)) });
}));

app.post('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const { customer, address, paymentMethod = 'qr' } = req.body || {};
  const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
  if (!cart?.items?.length) return res.status(400).json({ message: 'Your basket is empty.' });
  if (!customer?.name || !customer?.phone || !customer?.email || !address?.trim()) {
    return res.status(400).json({ message: 'Add your delivery details before placing the order.' });
  }
  const items = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.image,
    price: item.product.price,
    quantity: item.quantity
  }));
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const reference = `TN${Date.now().toString().slice(-8)}`;
  const order = await Order.create({
    user: req.userId,
    items,
    total,
    customer: { ...customer, address: address.trim() },
    payment: { method: paymentMethod, status: paymentMethod === 'cod' ? 'pending' : 'pending', reference }
  });
  await Cart.deleteOne({ user: req.userId });
  const upi = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=${encodeURIComponent(config.merchantName)}&am=${total.toFixed(2)}&cu=INR&tn=${reference}`;
  res.status(201).json({ order, qrData: upi, message: 'Order placed. Scan the QR code to complete payment.' });
}));

app.get('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ orders });
}));

app.post('/api/orders/:id/payment/verify', requireAuth, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  order.payment.status = 'paid';
  order.payment.reference = order.payment.reference || `TN${Date.now().toString().slice(-8)}`;
  await order.save();
  res.json({ order, message: 'Payment received. Your toys are being prepared!' });
}));

// Serve React production build when available (Render / Railway / Production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ message: error.message || 'Something did not go as planned. Please try again.' });
});

const port = config.port;
app.listen(port, () => console.log(`ToyNest API listening on http://localhost:${port}`));

export default app;
