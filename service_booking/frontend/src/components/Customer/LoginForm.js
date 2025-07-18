import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../config/api'; // Added import for api

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/token/', { // Changed axios to api
        username,
        password,
      });
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      onLogin && onLogin();
    } catch (err) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 350, margin: '100px auto', padding: 24, boxShadow: '0 2px 8px #eee', borderRadius: 8, background: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Login</h2>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4 }}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <div style={{ textAlign: 'center', margin: '16px 0' }}>or</div>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            const res = await api.post('/auth/social/login/', { // Changed axios to api
              provider: 'google',
              access_token: credentialResponse.credential,
            });
            localStorage.setItem('accessToken', res.data.access);
            localStorage.setItem('refreshToken', res.data.refresh);
            onLogin && onLogin();
          } catch (err) {
            setError('Google login failed.');
          }
        }}
        onError={() => setError('Google login failed.')}
      />
    </form>
  );
};

export default LoginForm; 