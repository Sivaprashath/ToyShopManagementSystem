import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import ProductQuickView from '../components/ProductQuickView.jsx';
import { DEFAULT_PRODUCTS, CATEGORIES } from '../data/defaultProducts.js';

export default function Home({ onProceedToPayment }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All toys');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch from backend, fallback to default catalog
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=30');
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.warn('Using local curated catalog:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filter and Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== 'All toys') {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-tag">
            <i className="fa-solid fa-sparkles" />
            <span>Curated Minimalist Toys • Placement Showcase</span>
          </div>

          <h1 className="hero-title">
            Simple, Meaningful Toys <br />
            <span className="text-gradient">Designed for Growing Minds.</span>
          </h1>

          <p className="hero-subtitle">
            Explore safe, eco-conscious, non-toxic toys crafted to spark curiosity and creativity.
            Includes transparent individual pricing, instant OTP sign-in, and seamless UPI QR checkout.
          </p>

          {/* Search bar */}
          <div className="hero-search-bar">
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-tertiary)', marginRight: '0.6rem' }} />
            <input
              type="text"
              placeholder="Search toys by name, age, or category (e.g. Robot, Stacking, STEM)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search toys"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ padding: '0.4rem', color: 'var(--text-tertiary)' }}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="container" id="catalog" style={{ paddingTop: '1rem' }}>
        {/* Category Filter Pills */}
        <div className="category-filter-bar" id="categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Header with Sort */}
        <div className="catalog-header">
          <div>
            <h2 className="catalog-title">
              {selectedCategory === 'All toys' ? 'All Collection' : selectedCategory}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {filteredProducts.length} premium toys
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sort by:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
            >
              <option value="featured">Featured Picks</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-medium)', margin: '2rem 0' }}>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ opacity: 0.6 }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              No toys found matching your filter
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Try clearing your search or switching categories.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All toys');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onDirectCheckout={onProceedToPayment}
        />
      )}
    </div>
  );
}
