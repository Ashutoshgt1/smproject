import React, { useState } from 'react';
import BookingHistory from './BookingHistory';
import NotificationBell from './NotificationBell';
import CustomerProfile from './CustomerProfile';
import CustomerComplaints from './CustomerComplaints';
import CustomerAnalytics from './CustomerAnalytics';

const CustomerDashboard = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">My Dashboard</h2>
        <NotificationBell userId={userId} />
      </div>
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'complaints' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('complaints')}
        >
          Complaints
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>
      {activeTab === 'dashboard' && <BookingHistory userId={userId} />}
      {activeTab === 'profile' && <CustomerProfile userId={userId} />}
      {activeTab === 'complaints' && <CustomerComplaints userId={userId} />}
      {activeTab === 'analytics' && <CustomerAnalytics userId={userId} />}
      {/* Add more customer dashboard widgets here as needed */}
    </div>
  );
};

export default CustomerDashboard; 