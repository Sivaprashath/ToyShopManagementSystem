import React from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, items } = useCart();
  const { addToast } = useToast();

  const cartItem = items.find((it) => (it.id || it._id) === (product.id || product._id));
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    addToast(`Added "${product.name}" to cart!`, 'success');
  };

  return (
    <div className="product-card" onClick={() => onQuickView(product)}>
      {/* Image and Badges */}
      <div className="product-img-box">
        <img
          src={product.image}
          alt={product.name}
          className="product-img"
          loading="lazy"
          onError={(e) => {
            // fallback placeholder with high contrast monochrome gradient
            e.target.src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80';
          }}
        />

        <div className="product-badges">
          {product.badge && (
            <span className="badge badge-mono">{product.badge}</span>
          )}
          <span className="badge badge-outline" style={{ background: 'var(--surface-glass)' }}>
            {product.age || 'All ages'}
          </span>
        </div>

        <button
          className="quick-view-trigger"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
        >
          <i className="fa-regular fa-eye" /> Quick View
        </button>
      </div>

      {/* Body */}
      <div className="product-body">
        <div className="product-meta">
          <span>{product.category}</span>
          <span>
            <i className="fa-solid fa-star" style={{ color: '#ffffff', marginRight: '3px' }} />
            {product.rating || 4.8} ({product.reviews || 95})
          </span>
        </div>

        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-desc">{product.description}</p>

        {/* Footer */}
        <div className="product-footer">
          <div className="price-box">
            <span className="current-price">₹{product.price.toLocaleString()}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="mrp-price">MRP ₹{product.mrp.toLocaleString()}</span>
            )}
          </div>

          <button
            className={`btn ${quantityInCart > 0 ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={handleAddToCart}
            title="Add toy to shopping basket"
          >
            <i className="fa-solid fa-plus" />
            {quantityInCart > 0 ? `In Cart (${quantityInCart})` : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
