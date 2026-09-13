import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('toynest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0); // e.g. 10 for 10%
  const [couponDiscount, setCouponDiscount] = useState(0); // fixed off

  // Save to localStorage whenever cart items change
  useEffect(() => {
    localStorage.setItem('toynest_cart', JSON.stringify(items));
  }, [items]);

  // Sync with backend if logged in
  useEffect(() => {
    async function syncBackendCart() {
      if (!token) return;
      try {
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cart?.items?.length) {
            // merge backend cart
            const serverItems = data.cart.items.map((it) => ({
              id: it.productId || it.id,
              name: it.name,
              category: it.category,
              price: it.price,
              mrp: it.mrp || Math.round(it.price * 1.2),
              image: it.image,
              stock: it.stock || 10,
              quantity: it.quantity,
              // Individual item cart calculation
              lineTotal: it.price * it.quantity
            }));
            setItems(serverItems);
          }
        }
      } catch (err) {
        console.warn('Backend cart sync skipped:', err.message);
      }
    }
    syncBackendCart();
  }, [token]);

  // ADD TO CART
  const addToCart = (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1);
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => (item.id || item._id) === (product.id || product._id));
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + qty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          // Individual cart calculation
          lineTotal: updated[existingIndex].price * newQty
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: product.id || product._id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            price: Number(product.price),
            mrp: Number(product.mrp || product.price * 1.2),
            image: product.image,
            stock: product.stock || 10,
            quantity: qty,
            // Individual cart calculation
            lineTotal: Number(product.price) * qty
          }
        ];
      }
    });

    // Optionally notify backend in background
    if (token) {
      fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id || product._id, quantity: qty })
      }).catch(() => {});
    }
  };

  // UPDATE QUANTITY
  const updateQuantity = (productId, newQuantity) => {
    const qty = Number(newQuantity);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if ((item.id || item._id) === productId) {
          const clampedQty = Math.min(item.stock || 99, qty);
          return {
            ...item,
            quantity: clampedQty,
            lineTotal: item.price * clampedQty
          };
        }
        return item;
      })
    );

    if (token) {
      fetch(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: qty })
      }).catch(() => {});
    }
  };

  // REMOVE FROM CART
  const removeFromCart = (productId) => {
    setItems((prevItems) => prevItems.filter((item) => (item.id || item._id) !== productId));
    if (token) {
      fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  };

  // CLEAR CART
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('toynest_cart');
  };

  // APPLY COUPON
  const applyCoupon = (code) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'PLACEMENT' || clean === 'FIRST15') {
      setCouponCode(clean);
      setDiscountPercent(15);
      setCouponDiscount(0);
      return { success: true, message: '🎉 15% Placement Offer Discount Applied!' };
    }
    if (clean === 'TOY50' || clean === 'SAVE50') {
      setCouponCode(clean);
      setDiscountPercent(0);
      setCouponDiscount(50);
      return { success: true, message: '🎉 ₹50 Instant Off Applied!' };
    }
    return { success: false, message: 'Invalid coupon code. Try PLACEMENT or TOY50.' };
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
    setCouponDiscount(0);
  };

  // TOTAL CART CALCULATIONS
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Discount calculation
  let calculatedDiscount = 0;
  if (discountPercent > 0) {
    calculatedDiscount = Math.round((subtotal * discountPercent) / 100);
  } else if (couponDiscount > 0) {
    calculatedDiscount = Math.min(subtotal, couponDiscount);
  }

  // Delivery: Free for orders >= 999
  const shippingFee = subtotal === 0 || subtotal >= 999 ? 0 : 49;
  
  // Grand Total of Cart
  const grandTotal = Math.max(0, subtotal - calculatedDiscount + shippingFee);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemCount,
        subtotal,
        discount: calculatedDiscount,
        shippingFee,
        grandTotal,
        couponCode,
        applyCoupon,
        removeCoupon,
        isDrawerOpen,
        openCart: () => setIsDrawerOpen(true),
        closeCart: () => setIsDrawerOpen(false)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
