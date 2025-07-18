import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, MapPin, Calendar, Clock, User, Settings } from 'lucide-react';
import websocketService from '../../services/websocket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import AvailabilityManager from './AvailabilityManager';

const ProviderDashboard = ({ user }) => {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'availability'

  useEffect(() => {
    // Connect to WebSocket
    const token = localStorage.getItem('authToken');
    if (token) {
      websocketService.connect(token);
      setIsConnected(true);
    }

    // Register WebSocket event handlers
    websocketService.on('booking_request', handleNewBookingRequest);
    websocketService.on('booking_confirmed', handleBookingConfirmed);
    websocketService.on('booking_closed', handleBookingClosed);

    // Fetch existing bookings
    fetchProviderBookings();

    return () => {
      websocketService.disconnect();
      websocketService.off('booking_request');
      websocketService.off('booking_confirmed');
      websocketService.off('booking_closed');
    };
  }, []);

  const fetchProviderBookings = async () => {
    try {
      const response = await api.get('/bookings/provider/');
      const notified = response.data.filter(b => b.status === 'notified');
      const active = response.data.filter(b => ['accepted', 'confirmed'].includes(b.status));
      
      setBookingRequests(notified);
      setActiveBookings(active);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    }
  };

  const handleNewBookingRequest = (data) => {
    toast('New booking request!', {
      icon: '🔔',
      duration: 5000,
    });
    
    setBookingRequests(prev => [{
      id: data.booking_id,
      ...data,
      status: 'notified'
    }, ...prev]);
  };

  const handleBookingConfirmed = (data) => {
    toast.success('Booking confirmed! 🎉');
    
    // Move from requests to active
    setBookingRequests(prev => prev.filter(b => b.id !== data.booking_id));
    fetchProviderBookings(); // Refresh to get updated data
  };

  const handleBookingClosed = (data) => {
    toast.info(data.message);
    setBookingRequests(prev => prev.filter(b => b.id !== data.booking_id));
  };

  const acceptBooking = (bookingId) => {
    websocketService.acceptBooking(bookingId);
  };

  const rejectBooking = (bookingId) => {
    websocketService.rejectBooking(bookingId);
    setBookingRequests(prev => prev.filter(b => b.id !== bookingId));
  };

  return (
    <div className="provider-dashboard">
      <div className="dashboard-header">
        <h1>Provider Dashboard</h1>
        <div className="header-actions">
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Bell size={18} />
              Bookings
            </button>
            <button 
              className={`tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
              onClick={() => setActiveTab('availability')}
            >
              <Settings size={18} />
              Availability
            </button>
          </div>
          
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2><Bell size={20} /> New Booking Requests</h2>
              <span className="badge badge-info">{bookingRequests.length}</span>
            </div>
            
            <div className="booking-list">
              {bookingRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No new booking requests</p>
                </div>
              ) : (
                bookingRequests.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3>{booking.service || booking.service_name}</h3>
                      <span className="badge badge-warning">New</span>
                    </div>
                    
                    <div className="booking-details">
                      <div className="detail-item">
                        <User size={16} />
                        <span>{booking.customer_name}</span>
                      </div>
                      <div className="detail-item">
                        <MapPin size={16} />
                        <span>{booking.address || booking.customer_address}</span>
                      </div>
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>{booking.scheduled_date}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{booking.scheduled_time}</span>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="booking-notes">
                        <strong>Notes:</strong> {booking.notes}
                      </div>
                    )}
                    
                    <div className="booking-actions">
                      <button 
                        className="btn btn-success"
                        onClick={() => acceptBooking(booking.id)}
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => rejectBooking(booking.id)}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2><CheckCircle size={20} /> Active Bookings</h2>
              <span className="badge badge-success">{activeBookings.length}</span>
            </div>
            
            <div className="booking-list">
              {activeBookings.length === 0 ? (
                <div className="empty-state">
                  <p>No active bookings</p>
                </div>
              ) : (
                activeBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3>{booking.service_name}</h3>
                      <span className="badge badge-success">Confirmed</span>
                    </div>
                    
                    <div className="booking-details">
                      <div className="detail-item">
                        <User size={16} />
                        <span>{booking.customer_name}</span>
                      </div>
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>{booking.scheduled_date}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{booking.scheduled_time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <AvailabilityManager />
      )}

      <style jsx>{`
        .provider-dashboard {
          padding: 40px 0;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .tab-switcher {
          display: flex;
          background: white;
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        
        .tab-btn.active {
          background: #3b82f6;
          color: white;
        }
        
        .tab-btn:hover:not(.active) {
          background: #f3f4f6;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .status-indicator.connected {
          background-color: #10b981;
        }
        
        .status-indicator.disconnected {
          background-color: #ef4444;
          animation: none;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .dashboard-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          margin: 0;
        }
        
        .booking-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .booking-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        
        .booking-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .booking-header h3 {
          font-size: 16px;
          margin: 0;
        }
        
        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
        }
        
        .booking-notes {
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .booking-actions {
          display: flex;
          gap: 12px;
        }
        
        .booking-actions .btn {
          flex: 1;
          justify-content: center;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default ProviderDashboard; 