import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AuthModal({ isOpen, onClose }) {
  const { user, pendingOtp, register, login, verifyOtp, resendOtp, cancelOtp } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');

  // OTP inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const otpInputRefs = useRef([]);

  // Reset timer whenever pendingOtp arrives
  useEffect(() => {
    if (pendingOtp) {
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [pendingOtp]);

  // Countdown timer
  useEffect(() => {
    let interval;
    if (pendingOtp && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [pendingOtp, timer]);

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      addToast('Please enter your email/username and password.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ identifier, password });
      addToast(res.message || 'OTP verification code sent.', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !phone.trim() || !password) {
      addToast('Please complete all registration fields.', 'error');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await register({ username, email, phone, password });
      addToast('Account created! Please verify with the 6-digit OTP code.', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Digit Change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto move to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste 6 digits
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };


  // Submit OTP Verification
  const handleVerifyOtpSubmit = async (e) => {
    e?.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      addToast('Please enter all 6 digits of the OTP code.', 'error');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({
        email: pendingOtp.email,
        code: fullCode,
        purpose: pendingOtp.purpose
      });
      addToast('OTP verified successfully! Welcome to ToyNest.', 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'OTP verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await resendOtp();
      setTimer(60);
      addToast('A new OTP code has been generated.', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (pendingOtp) cancelOtp();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close dialog">
          <i className="fa-solid fa-xmark" />
        </button>

        {pendingOtp ? (
          /* ==========================================================
             OTP VERIFICATION SCREEN
             ========================================================== */
          <div className="auth-body">
            <div className="otp-container">
              <div className="otp-icon">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <h3 className="auth-title">Verify OTP Code</h3>
              <p className="auth-subtitle">
                We sent a 6-digit verification code to your email <br />
                <strong style={{ color: 'var(--text-primary)' }}>{pendingOtp.email}</strong>.
                <br />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Please check your inbox (or spam folder) and enter the code below.
                </span>
              </p>

              {/* Instant Verification Code Card (for fast demo / cloud delivery) */}
              {pendingOtp.devOtp && (
                <div
                  onClick={() => {
                    const digits = pendingOtp.devOtp.split('');
                    setOtpDigits(digits);
                    otpInputRefs.current[5]?.focus();
                    addToast('Verification code auto-filled!', 'success');
                  }}
                  style={{
                    margin: '0.85rem 0 1.25rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  title="Click to auto-fill"
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚡ Instant Verification Code
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857', letterSpacing: '3px', fontFamily: 'monospace' }}>
                      {pendingOtp.devOtp}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#059669',
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    Auto-Fill ↵
                  </span>
                </div>
              )}

              {/* 6-Digit PIN Inputs */}
              <form onSubmit={handleVerifyOtpSubmit}>
                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="otp-digit"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loading || otpDigits.join('').length < 6}
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Continue'}
                </button>
              </form>

              {/* Timer and Resend */}
              <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {timer > 0 ? (
                  <span>Resend code in <strong>{timer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{ fontWeight: 700, textDecoration: 'underline', color: 'var(--text-primary)' }}
                    disabled={loading}
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={cancelOtp}
                style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}
              >
                ← Back to Login / Register
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================================
             LOGIN / REGISTER SCREEN
             ========================================================== */
          <>
            <div className="auth-header">
              <h3 className="auth-title">Welcome to TOYNEST</h3>
              <p className="auth-subtitle">
                {activeTab === 'login' ? 'Sign in to access your cart and saved orders' : 'Create your account with instant OTP verification'}
              </p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>

            <div className="auth-body">
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label className="form-label">Email or Username</label>
                    <div className="input-wrapper">
                      <i className="fa-regular fa-envelope input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="siva@example.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrapper">
                      <i className="fa-solid fa-lock input-icon" />
                      <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Requesting OTP...' : 'Continue to OTP Verification'}
                  </button>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '1rem' }}>
                    Tip: Any password works in demo mode. OTP code will be shown on the next screen.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Username</label>
                    <div className="input-wrapper">
                      <i className="fa-regular fa-user input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Siva Kumar"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                    <label className="form-label">Create Password</label>
                    <div className="input-wrapper">
                      <i className="fa-solid fa-lock input-icon" />
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Register & Verify with OTP'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
