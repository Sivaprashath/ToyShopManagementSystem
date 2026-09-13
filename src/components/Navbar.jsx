import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar({ onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItemCount, grandTotal, openCart } = useCart();
  const [theme, setTheme] = useState(() => localStorage.getItem('toynest_theme') || 'dark');
  const [userDropdown, setUserDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('toynest_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <i className="fa-solid fa-cube"></i>
          </div>
          <span>TOYNEST</span>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Shop Catalog
          </Link>
          <a href="#categories" className="nav-link">
            Categories
          </a>
          <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>
            My Orders
          </Link>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          {/* Theme Switcher */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Monochrome' : 'Switch to Dark Obsidian'}
            aria-label="Toggle Monochrome Theme"
          >
            {theme === 'dark' ? (
              <i className="fa-regular fa-sun" />
            ) : (
              <i className="fa-regular fa-moon" />
            )}
          </button>

          {/* Cart Button with Individual/Total Badge */}
          <button
            className="cart-btn"
            onClick={openCart}
            title="View Cart & Bill Breakdown"
            aria-label="View Shopping Cart"
          >
            <i className="fa-solid fa-bag-shopping" />
            <span className="cart-badge">{totalItemCount}</span>
            {totalItemCount > 0 && (
              <span style={{ marginLeft: '0.2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                ₹{grandTotal.toLocaleString()}
              </span>
            )}
          </button>

          {/* User Auth */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <div
                className="user-chip"
                onClick={() => setUserDropdown((prev) => !prev)}
                title="Account Menu"
              >
                <div className="user-avatar">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.username || 'Account'}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', opacity: 0.7 }} />
              </div>

              {userDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px',
                    padding: '0.5rem',
                    zIndex: 200
                  }}
                >
                  <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email}
                    </div>
                  </div>
                  <Link
                    to="/orders"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.8rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    onClick={() => setUserDropdown(false)}
                  >
                    <i className="fa-solid fa-box" /> My Orders
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      fontSize: '0.85rem',
                      color: '#ef4444',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left'
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <i className="fa-regular fa-user" /> Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
