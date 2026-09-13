import React, { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProductQuickView({ product, onClose, onDirectCheckout }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, qty);
    addToast(`Added ${qty} × "${product.name}" to cart!`, 'success');
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    onClose();
    if (onDirectCheckout) onDirectCheckout();
  };

  const itemSubtotal = product.price * qty;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">
          <i className="fa-solid fa-xmark" />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Image Side */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={product.image}
              alt={product.name}
              style={{ maxHeight: '360px', width: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          {/* Details Side */}
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-mono">{product.category}</span>
              <span className="badge badge-outline">Age: {product.age || 'All ages'}</span>
              <span className="badge badge-outline" style={{ color: '#ffffff' }}>
                <i className="fa-solid fa-check" style={{ marginRight: '4px' }} />
                In Stock ({product.stock || 12} left)
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.6rem' }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <i key={s} className="fa-solid fa-star" style={{ color: '#ffffff', fontSize: '0.85rem' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {product.rating} ({product.reviews} customer reviews)
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {product.description}
            </p>

            {product.features && product.features.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Highlights & Safety:
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {product.features.map((feat, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-check" style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price and Calculation */}
            <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Unit Price</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                    ₹{product.price.toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Subtotal ({qty} items)</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                    ₹{itemSubtotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quantity Picker & Add button */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div className="quantity-control" style={{ padding: '0.2rem' }}>
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <i className="fa-solid fa-minus" />
                  </button>
                  <span className="qty-value" style={{ minWidth: '2rem', textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.min(product.stock || 20, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <i className="fa-solid fa-plus" />
                  </button>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleAdd}
                >
                  <i className="fa-solid fa-bag-shopping" /> Add to Cart
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={handleBuyNow}
                  title="Direct checkout with QR Code"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
