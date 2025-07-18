import React, { useState } from 'react';
import axios from 'axios';
import api from '../../config/api';

const SignupForm = ({ onSignup }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Register the user
      await api.post('/register/', form);
      // Log in automatically
      const loginRes = await api.post('/token/', {
        username: form.username,
        password: form.password,
      });
      localStorage.setItem('accessToken', loginRes.data.access);
      localStorage.setItem('refreshToken', loginRes.data.refresh);
      onSignup && onSignup();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).flat().join(' ') ||
        'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '100px auto', padding: 24, boxShadow: '0 2px 8px #eee', borderRadius: 8, background: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Sign Up</h2>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" value={form.username} onChange={handleChange} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" value={form.phone} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#10b981', color: '#fff', border: 'none', borderRadius: 4 }}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignupForm; 