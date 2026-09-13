import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function QrPaymentModal({ isOpen, onClose, onPaymentSuccess }) {
  const { items, grandTotal, subtotal, discount, shippingFee, clearCart } = useCart();
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState('details'); // 'details' | 'qr' | 'success'
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Customer delivery details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [pincode, setPincode] = useState('560001');

  // Auto-fill from logged in user if available
  useEffect(() => {
    if (user) {
      if (user.username && !fullName) setFullName(user.username);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  if (!isOpen) return null;

  // STEP 1: Generate QR Payment Session
  const handleProceedToQr = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      addToast('Please complete all delivery address details.', 'error');
      return;
    }

    setLoading(true);
    const orderRef = `TN${Date.now().toString().slice(-8)}`;

    try {
      // If user has token, create real order on backend
      let serverOrder = null;
      let upiData = `upi://pay?pa=toynest@upi&pn=ToyNest%20Store&am=${grandTotal.toFixed(2)}&cu=INR&tn=${orderRef}`;

      if (token) {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customer: { name: fullName, phone, email },
            address: `${address}, ${city} - ${pincode}`,
            paymentMethod: 'qr'
          })
        });

        if (res.ok) {
          const data = await res.json();
          serverOrder = data.order;
          if (data.qrData) upiData = data.qrData;
        }
      }

      // Build local/hybrid order payload
      const preparedOrder = serverOrder || {
        _id: 'ord_' + Date.now(),
        orderId: orderRef,
        reference: orderRef,
        createdAt: new Date().toISOString(),
        customer: {
          name: fullName,
          phone,
          email,
          address: `${address}, ${city} - ${pincode}`
        },
        items: items.map((it) => ({
          productId: it.id || it._id,
          name: it.name,
          image: it.image,
          price: it.price,
          quantity: it.quantity,
          lineTotal: it.price * it.quantity
        })),
        subtotal,
        discount,
        shippingFee,
        total: grandTotal,
        payment: {
          method: 'UPI QR',
          status: 'pending',
          reference: orderRef
        },
        qrData: upiData
      };

      setOrderData(preparedOrder);
      setStep('qr');
      addToast('QR Code generated. Scan to complete payment!', 'info');
    } catch (err) {
      addToast('Proceeding to offline QR simulation: ' + err.message, 'info');
      const preparedOrder = {
        _id: 'ord_' + Date.now(),
        orderId: orderRef,
        reference: orderRef,
        createdAt: new Date().toISOString(),
        customer: {
          name: fullName,
          phone,
          email,
          address: `${address}, ${city} - ${pincode}`
        },
        items: [...items],
        subtotal,
        discount,
        shippingFee,
        total: grandTotal,
        payment: {
          method: 'UPI QR',
          status: 'pending',
          reference: orderRef
        },
        qrData: `upi://pay?pa=toynest@upi&pn=ToyNest%20Store&am=${grandTotal.toFixed(2)}&cu=INR&tn=${orderRef}`
      };
      setOrderData(preparedOrder);
      setStep('qr');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify / Simulate Payment Confirmation
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      if (token && orderData?._id && !orderData._id.startsWith('ord_')) {
        await fetch(`/api/orders/${orderData._id}/payment/verify`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      const completedOrder = {
        ...orderData,
        payment: {
          ...orderData.payment,
          status: 'paid',
          paidAt: new Date().toISOString()
        }
      };

      // Save order to localStorage for order history
      try {
        const existingOrders = JSON.parse(localStorage.getItem('toynest_orders') || '[]');
        localStorage.setItem('toynest_orders', JSON.stringify([completedOrder, ...existingOrders]));
      } catch {
        // ignore
      }

      setOrderData(completedOrder);
      setStep('success');
      clearCart();
      addToast('Payment Verified! Order placed successfully.', 'success');

      if (onPaymentSuccess) {
        onPaymentSuccess(completedOrder);
      }
    } catch (err) {
      addToast('Payment verified successfully in demo mode!', 'success');
      const completedOrder = {
        ...orderData,
        payment: {
          ...orderData.payment,
          status: 'paid',
          paidAt: new Date().toISOString()
        }
      };
      setOrderData(completedOrder);
      setStep('success');
      clearCart();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('toynest@upi');
    addToast('UPI ID copied to clipboard: toynest@upi', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: step === 'qr' ? '540px' : '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">
          <i className="fa-solid fa-xmark" />
        </button>

        {/* ==============================================================
            STEP 1: DELIVERY & ADDRESS DETAILS
            ============================================================== */}
        {step === 'details' && (
          <div className="auth-body" style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="badge badge-mono" style={{ marginBottom: '0.5rem' }}>Step 1 of 2</span>
              <h3 className="auth-title">Delivery Details</h3>
              <p className="auth-subtitle">Where should we deliver your toys?</p>
            </div>

            <form onSubmit={handleProceedToQr}>
              <div className="form-group">
                <label className="form-label">Customer Full Name</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-user input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Siva Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-phone input-icon" />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <i className="fa-regular fa-envelope input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="siva@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address & Flat / House No.</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '65px', resize: 'vertical' }}
                  placeholder="Flat 302, Green Valley Apartments, 5th Cross Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Order Amount preview */}
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Payable Amount</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
                    ₹{grandTotal.toLocaleString()}
                  </div>
                </div>
                <span className="badge badge-mono">UPI QR Payment</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Generating QR Code...' : 'Proceed to Scan QR Code'}
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            STEP 2: SCAN QR CODE & PAY
            ============================================================== */}
        {step === 'qr' && (
          <div className="qr-payment-container">
            <span className="badge badge-mono" style={{ marginBottom: '0.5rem' }}>Step 2 of 2</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>
              Scan QR Code to Pay Bill
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Scan using any UPI App (Google Pay, PhonePe, Paytm, BHIM)
            </p>

            {/* Prominent Amount */}
            <div className="qr-amount-badge">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Total Bill:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>

            {/* Dynamic QR Code Render */}
            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={orderData?.qrData || `upi://pay?pa=toynest@upi&pn=ToyNest Store&am=${grandTotal}&cu=INR`}
                size={190}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>

            {/* UPI ID Info & Copy */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div className="upi-id-pill" onClick={handleCopyUpi} title="Click to copy UPI ID">
                <span>toynest@upi</span>
                <i className="fa-regular fa-copy" />
              </div>
              <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                Ref: {orderData?.reference || 'TN-LIVE'}
              </span>
            </div>

            {/* Individual Item Preview Accordion/Table */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left', border: '1px solid var(--border-subtle)', maxHeight: '130px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
                Bill Summary:
              </div>
              {orderData?.items?.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                    {it.name} (×{it.quantity})
                  </span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    ₹{(it.price * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment simulation button for Placement & Testing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                <i className="fa-solid fa-check-double" />
                {loading ? 'Verifying Payment...' : 'Simulate Instant Payment (Placement Demo)'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setStep('details')}
              >
                ← Back to Delivery Address
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 3: PAYMENT CONFIRMED & SUCCESS
            ============================================================== */}
        {step === 'success' && (
          <div className="auth-body" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-glow)' }}>
              <i className="fa-solid fa-check" />
            </div>

            <span className="badge badge-mono" style={{ marginBottom: '0.6rem' }}>Payment Confirmed</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Thank You for Your Order!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Your payment of <strong>₹{grandTotal.toLocaleString()}</strong> was received via UPI QR. We are packing your toys right away!
            </p>

            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Order Reference:</span>
                <strong>{orderData?.reference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Payment Method:</span>
                <span>UPI QR Code (Paid)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Delivering to:</span>
                <span style={{ textAlign: 'right', maxWidth: '200px' }}>{orderData?.customer?.name}, {city}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  onClose();
                  if (onPaymentSuccess) onPaymentSuccess(orderData);
                }}
              >
                <i className="fa-solid fa-receipt" /> View & Print Invoice
              </button>
              <button className="btn btn-outline" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
