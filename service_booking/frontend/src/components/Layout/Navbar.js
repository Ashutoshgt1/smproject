import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, Calendar, Moon, Sun } from 'lucide-react';
import NotificationBell from '../Customer/NotificationBell';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <Home size={24} />
          <span>ServiceBook</span>
        </Link>
        
        <div className="navbar-menu">
          
          {user ? (
            <>
              <Link to="/bookings" className="navbar-link">
                <Calendar size={20} />
                <span>My Bookings</span>
              </Link>
              
              {user.user_type === 'provider' && (
                <Link to="/provider/dashboard" className="navbar-link">
                  <User size={20} />
                  <span>Dashboard</span>
                </Link>
              )}
              {user.user_type === 'customer' && (
                <NotificationBell userId={user.id} />
              )}
              <div className="navbar-user">
                <span>Hi, {user.first_name || user.username}</span>
                <button onClick={handleLogout} className="btn-logout">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          )}
        </div>
      </div>
      
      <style>{`
        .navbar {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .navbar .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          text-decoration: none;
        }
        
        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .navbar-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }
        
        .navbar-link:hover {
          color: #3b82f6;
        }
        
        .navbar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #374151;
          font-weight: 500;
        }
        
        .btn-logout {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.3s ease;
        }
        
        .btn-logout:hover {
          color: #ef4444;
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 