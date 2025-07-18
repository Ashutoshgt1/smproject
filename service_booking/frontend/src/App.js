import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Layout/Navbar';
import BookingForm from './components/Customer/BookingForm';
import ProviderDashboard from './components/Provider/Dashboard';
import api from './config/api';
import LoginForm from './components/Customer/LoginForm';
import SignupForm from './components/Customer/SignupForm';
import { GoogleOAuthProvider } from '@react-oauth/google';
import BookingHistory from './components/Customer/BookingHistory';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/me/');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <Navbar user={user} onLogout={handleLogout} />
          
          <div className="container">
            <Routes>
              <Route path="/" element={
                user ? (
                  user.user_type === 'provider' ? (
                    <Navigate to="/provider/dashboard" />
                  ) : (
                    <BookingForm />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              } />
              
              <Route path="/provider/dashboard" element={
                user && user.user_type === 'provider' ? (
                  <ProviderDashboard user={user} />
                ) : (
                  <Navigate to="/" />
                )
              } />
              
              <Route path="/book-service" element={
                user && user.user_type === 'customer' ? (
                  <BookingForm />
                ) : (
                  <Navigate to="/" />
                )
              } />
              
              <Route path="/bookings" element={
                user && user.user_type === 'customer' ? (
                  <BookingHistory user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } />
              
              <Route path="/login" element={
                <LoginForm onLogin={fetchCurrentUser} />
              } />

              <Route path="/register" element={
                <SignupForm onSignup={fetchCurrentUser} />
              } />

              {/* Catch-all route for unknown paths */}
              <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
            </Routes>
          </div>
          
          <Toaster position="top-right" />
        </div>
        
        <style>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
        `}</style>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
