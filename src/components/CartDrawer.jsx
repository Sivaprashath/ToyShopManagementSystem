import React, { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function CartDrawer({ onProceedToPayment }) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    shippingFee,
    grandTotal,
    couponCode,
    applyCoupon,
    removeCoupon,
    isDrawerOpen,
    closeCart
  } = useCart();

  const { addToast } = useToast();
  const [promoInput, setPromoInput] = useState('');

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyCoupon(promoInput);
    if (res.success) {
      addToast(res.message, 'success');
      setPromoInput('');
    } else {
      addToast(res.message, 'error');
    }
  };

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <>
      <div className="drawer-overlay" onClick={closeCart} />
      <div className="drawer-content">
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <i className="fa-solid fa-cart-shopping" />
            <span>Your Shopping Cart</span>
            <span className="badge badge-mono" style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button className="modal-close" onClick={closeCart} aria-label="Close cart">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div style={{ padding: '0.85rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              {remainingForFreeShipping > 0 ? (
                <span>Add <strong>₹{remainingForFreeShipping}</strong> more for <strong>FREE Delivery</strong></span>
              ) : (
                <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-truck-fast" /> You unlocked FREE Delivery!
                </span>
              )}
              <span>{freeShippingProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border-medium)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${freeShippingProgress}%`,
                  height: '100%',
                  background: 'var(--text-primary)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '1.25rem' }}>
              <i className="fa-solid fa-basket-shopping" style={{ opacity: 0.5 }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Your cart is empty
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px', marginBottom: '1.5rem' }}>
              Explore our minimalist toy catalog and pick playful toys for kids!
            </p>
            <button className="btn btn-primary" onClick={closeCart}>
              Browse Toys Catalog
            </button>
          </div>
        ) : (
          <div className="drawer-items-list">
            {items.map((item) => {
              const itemLineTotal = item.price * item.quantity;
              return (
                <div key={item.id || item._id} className="cart-item-card">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-img"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <div>
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-unit-price">
                          ₹{item.price.toLocaleString()} unit price
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          removeFromCart(item.id || item._id);
                          addToast(`Removed "${item.name}" from cart`, 'info');
                        }}
                        style={{ color: 'var(--text-tertiary)', padding: '0.2rem', transition: 'color 0.15s' }}
                        title="Remove item"
                      >
                        <i className="fa-regular fa-trash-can" />
                      </button>
                    </div>

                    <div className="cart-item-bottom">
                      {/* Quantity buttons */}
                      <div className="quantity-control">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <i className="fa-solid fa-minus" />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <i className="fa-solid fa-plus" />
                        </button>
                      </div>

                      {/* INDIVIDUAL CART AMOUNT */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Item Total
                        </div>
                        <div className="cart-item-line-total">
                          ₹{itemLineTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer with Totals and Checkout */}
        {items.length > 0 && (
          <div className="drawer-footer">
            {/* Promo Code Form */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Coupon code (e.g. PLACEMENT)"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem', textTransform: 'uppercase' }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Apply
              </button>
            </form>

            {couponCode && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                <span>
                  <i className="fa-solid fa-tag" style={{ marginRight: '6px' }} />
                  Coupon <strong>{couponCode}</strong> applied
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Bill Breakdown */}
            <div className="bill-breakdown">
              <div className="bill-row">
                <span>Items Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div className="bill-row" style={{ color: '#ffffff' }}>
                  <span>Promo Discount</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="bill-row">
                <span>Delivery Charges</span>
                <span>{shippingFee === 0 ? <strong style={{ color: '#ffffff' }}>FREE</strong> : `₹${shippingFee}`}</span>
              </div>

              {/* GRAND TOTAL */}
              <div className="bill-row total">
                <span>Total Cart Amount</span>
                <span>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => {
                  closeCart();
                  onProceedToPayment();
                }}
              >
                <i className="fa-solid fa-qrcode" /> Proceed to QR Code Payment
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={closeCart}
                  style={{ flex: 1, marginRight: '0.5rem' }}
                >
                  Continue Shopping
                </button>
                <button
                  className="btn btn-danger-outline btn-sm"
                  onClick={() => {
                    if (window.confirm('Clear all items from your cart?')) {
                      clearCart();
                      addToast('Cart cleared', 'info');
                    }
                  }}
                  title="Remove all items"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
