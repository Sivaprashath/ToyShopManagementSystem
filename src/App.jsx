import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Navbar from './components/Navbar.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import AuthModal from './components/AuthModal.jsx';
import QrPaymentModal from './components/QrPaymentModal.jsx';
import InvoiceModal from './components/InvoiceModal.jsx';
import Home from './pages/Home.jsx';
import OrdersPage from './pages/OrdersPage.jsx';

function MainLayout() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQrPaymentOpen, setIsQrPaymentOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const handleOpenAuth = () => setIsAuthOpen(true);
  const handleProceedToPayment = () => setIsQrPaymentOpen(true);
  const handlePaymentSuccess = (completedOrder) => {
    setIsQrPaymentOpen(false);
    setInvoiceOrder(completedOrder);
  };

  return (
    <div className="app-wrapper">
      {/* Navigation Bar */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* Page Routing */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home onProceedToPayment={handleProceedToPayment} />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </main>

      {/* Global Modals & Drawers */}
      <CartDrawer onProceedToPayment={handleProceedToPayment} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <QrPaymentModal
        isOpen={isQrPaymentOpen}
        onClose={() => setIsQrPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Minimalist Monochrome Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', padding: '1.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
              <i className="fa-solid fa-cube" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
              TOYNEST
            </span>
            <span>• Minimalist Toy Shop & Management</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} TOYNEST. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <MainLayout />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
