import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InvoiceModal from '../components/InvoiceModal.jsx';

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('toynest_orders') || '[]');
      } catch {
        localOrders = [];
      }

      if (token) {
        try {
          const res = await fetch('/api/orders', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.orders && data.orders.length > 0) {
              setOrders(data.orders);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Backend orders fetch failed, using local orders:', err.message);
        }
      }

      setOrders(localOrders);
      setLoading(false);
    }

    loadOrders();
  }, [token]);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <i className="fa-solid fa-arrow-left" /> Back to Catalog
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800 }}>
          My Toy Orders
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          View order history, payment verification, and download itemized tax invoices.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
          <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-medium)' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1rem' }}>
            <i className="fa-solid fa-box-open" style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No orders placed yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Add toys to your cart and complete checkout with our UPI QR payment simulator.
          </p>
          <Link to="/" className="btn btn-primary">
            Explore Toys Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((ord, idx) => {
            const isPaid = ord.payment?.status === 'paid';
            const orderDate = ord.createdAt
              ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : 'Recent Order';

            return (
              <div
                key={ord._id || idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  transition: 'border-color 0.2s'
                }}
              >
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>ORDER REF</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
                      #{ord.payment?.reference || ord.reference || ord._id?.slice(-8)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Placed on {orderDate}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, background: isPaid ? '#ffffff' : 'var(--bg-secondary)', color: isPaid ? '#000000' : 'var(--text-primary)', border: '1px solid var(--border-medium)', textTransform: 'uppercase' }}>
                      <i className={`fa-solid ${isPaid ? 'fa-circle-check' : 'fa-clock'}`} />
                      {isPaid ? 'PAID • UPI QR' : 'Payment Pending'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginTop: '0.3rem' }}>
                      ₹{ord.total?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {ord.items?.map((it, itemIdx) => (
                    <div key={itemIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {it.image && (
                          <img
                            src={it.image}
                            alt={it.name}
                            style={{ width: '2.5rem', height: '2.5rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Qty: {it.quantity} × ₹{it.price}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        ₹{(it.price * it.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedInvoiceOrder(ord)}
                  >
                    <i className="fa-solid fa-file-invoice" /> View & Print Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
