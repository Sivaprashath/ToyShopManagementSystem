import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('toynest_token') || '');
  const [loading, setLoading] = useState(true);

  // OTP Pending State
  const [pendingOtp, setPendingOtp] = useState(null); 
  // pendingOtp structure: { email, purpose, devOtp, tempUser, message }

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('toynest_token');
      const storedUser = localStorage.getItem('toynest_user');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore
        }
      }

      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('toynest_user', JSON.stringify(data.user));
          } else {
            // Token might be expired
            if (!storedUser) {
              logout();
            }
          }
        } catch (err) {
          console.warn('Backend offline, using offline session:', err.message);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  // REGISTER
  async function register({ username, phone, email, password }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phone, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed.');
    }

    setPendingOtp({
      email: email.toLowerCase(),
      purpose: 'register',
      tempUser: data.user || { username, email, phone },
      message: data.message || 'Verification code sent to your email.'
    });

    return { success: true, pendingOtp: true, data };
  }

  // LOGIN
  async function login({ identifier, password }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Invalid login credentials.');
    }

    setPendingOtp({
      email: (data.user?.email || identifier).toLowerCase(),
      purpose: 'login',
      tempUser: data.user,
      message: data.message || 'Enter verification code sent to your email.'
    });

    return { success: true, pendingOtp: true, data };
  }

  // VERIFY OTP
  async function verifyOtp({ email, code, purpose }) {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, purpose })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Invalid or expired OTP code.');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('toynest_token', data.token);
    localStorage.setItem('toynest_user', JSON.stringify(data.user));
    setPendingOtp(null);

    return { success: true, user: data.user };
  }

  // RESEND OTP
  async function resendOtp() {
    if (!pendingOtp?.email) throw new Error('No active verification session.');
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingOtp.email, purpose: pendingOtp.purpose })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to resend code.');
    }
    setPendingOtp((prev) => ({
      ...prev,
      message: 'A fresh OTP code was sent to your email inbox.'
    }));
    return { success: true };
  }

  function cancelOtp() {
    setPendingOtp(null);
  }

  function logout() {
    setToken('');
    setUser(null);
    setPendingOtp(null);
    localStorage.removeItem('toynest_token');
    localStorage.removeItem('toynest_user');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingOtp,
        register,
        login,
        verifyOtp,
        resendOtp,
        cancelOtp,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
