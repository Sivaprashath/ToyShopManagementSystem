import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, required: true },
    age: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, default: 4.5, min: 0, max: 5 },
    reviews: { type: Number, required: true, default: 0, min: 0 },
    description: { type: String, required: true },
    features: [String],
    image: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    badge: { type: String, default: '' },
    colors: [String]
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
