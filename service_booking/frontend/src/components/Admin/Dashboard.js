import React, { useEffect, useRef, useState } from 'react';
// FontAwesome and Chart.js are loaded via CDN in your HTML, but in React, use npm packages:
// npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons chart.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faWrench, faUser, faWallet, faUsers, faHardHat, faRupeeSign, faCalendarCheck, faUserPlus, faUserCog, faBan, faPlusCircle, faCheckCircle, faStar, faPercentage, faFileInvoice, faMoneyCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Chart from 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import UserTable from './UserTable';
import ProviderTable from './ProviderTable';
import BookingTable from './BookingTable';
import ComplaintTable from './ComplaintTable';
import Spinner from './Spinner';
import { Toaster, toast } from 'react-hot-toast';
import MaterialTable from './MaterialTable';
import AdminTable from './AdminTable';
import AuditLogTable from './AuditLogTable';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminDashboard = () => {
  const revenueChartRef = useRef(null);
  const analyticsChartRef = useRef(null);

  // State for admin tables
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);

  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [complaintsError, setComplaintsError] = useState(null);

  const [analyticsStart, setAnalyticsStart] = useState(null);
  const [analyticsEnd, setAnalyticsEnd] = useState(null);
  const [analyticsStatus, setAnalyticsStatus] = useState('');
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    // Render the revenue chart
    if (revenueChartRef.current) {
      new Chart(revenueChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Revenue',
            data: [120000, 150000, 180000, 170000, 210000, 250000, 220000],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
        },
      });
    }
  }, []);

  // Fetch users
  useEffect(() => {
    setUsersLoading(true);
    fetch('/api/admin/accounts/users/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => setUsersError(err.message))
      .finally(() => setUsersLoading(false));
  }, []);

  // Fetch providers
  useEffect(() => {
    setProvidersLoading(true);
    fetch('/api/admin/accounts/providers/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch providers');
        return res.json();
      })
      .then(data => setProviders(data))
      .catch(err => setProvidersError(err.message))
      .finally(() => setProvidersLoading(false));
  }, []);

  // Fetch bookings
  useEffect(() => {
    setBookingsLoading(true);
    fetch('/api/admin/bookings/bookings/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
      })
      .then(data => setBookings(data))
      .catch(err => setBookingsError(err.message))
      .finally(() => setBookingsLoading(false));
  }, []);

  // Fetch complaints
  useEffect(() => {
    setComplaintsLoading(true);
    fetch('/api/admin/reviews/complaints/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch complaints');
        return res.json();
      })
      .then(data => setComplaints(data))
      .catch(err => setComplaintsError(err.message))
      .finally(() => setComplaintsLoading(false));
  }, []);

  // Fetch bookings for analytics
  useEffect(() => {
    let url = '/api/admin/bookings/bookings/?ordering=scheduled_time';
    if (analyticsStatus) url += `&status=${analyticsStatus}`;
    if (analyticsStart) url += `&scheduled_from=${analyticsStart.toISOString().slice(0, 10)}`;
    if (analyticsEnd) url += `&scheduled_to=${analyticsEnd.toISOString().slice(0, 10)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Group bookings by date
        const counts = {};
        data.forEach(b => {
          const date = b.scheduled_time ? b.scheduled_time.slice(0, 10) : 'Unscheduled';
          counts[date] = (counts[date] || 0) + 1;
        });
        const sortedDates = Object.keys(counts).sort();
        setAnalyticsData(sortedDates.map(date => ({ date, count: counts[date] })));
      });
  }, [analyticsStart, analyticsEnd, analyticsStatus]);

  // Render chart
  useEffect(() => {
    if (!analyticsChartRef.current) return;
    const chart = new Chart(analyticsChartRef.current, {
      type: 'bar',
      data: {
        labels: analyticsData.map(d => d.date),
        datasets: [{
          label: 'Bookings',
          data: analyticsData.map(d => d.count),
          backgroundColor: '#3b82f6',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });
    return () => chart.destroy();
  }, [analyticsData]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Bookings'];
    const rows = analyticsData.map(d => [d.date, d.count]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (usersError) toast.error(usersError);
  }, [usersError]);
  useEffect(() => {
    if (providersError) toast.error(providersError);
  }, [providersError]);
  useEffect(() => {
    if (bookingsError) toast.error(bookingsError);
  }, [bookingsError]);
  useEffect(() => {
    if (complaintsError) toast.error(complaintsError);
  }, [complaintsError]);

  // Mock data for stats and activities (can be replaced with real API data)
  const stats = [
    { label: 'Total Users', value: users.length, change: '+12% this month', icon: faUsers, color: 'text-blue-500', changeColor: 'text-green-500' },
    { label: 'Service Providers', value: providers.length, change: '+8% this month', icon: faHardHat, color: 'text-green-500', changeColor: 'text-green-500' },
    { label: 'Total Revenue', value: '₹45.2L', change: '+23% this month', icon: faRupeeSign, color: 'text-yellow-500', changeColor: 'text-green-500' },
    { label: 'Active Bookings', value: bookings.length, change: '-5% this month', icon: faCalendarCheck, color: 'text-purple-500', changeColor: 'text-red-500' },
  ];

  const activities = [
    { icon: faUserPlus, iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'New provider registered', subtitle: 'Rajesh Kumar - Plumber', time: '2 min ago' },
    { icon: faRupeeSign, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Payment received', subtitle: '₹1,500 from booking #12543', time: '15 min ago' },
    { icon: faExclamationTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600', title: 'New complaint filed', subtitle: 'Service quality issue - #C2451', time: '1 hour ago' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h2 className="text-3xl font-bold mb-6">Admin Superpanel Dashboard</h2>
      {/* Advanced Analytics Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="font-bold text-lg mb-4">Bookings Over Time</h3>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={analyticsStatus}
              onChange={e => setAnalyticsStatus(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <DatePicker
              selected={analyticsStart}
              onChange={date => setAnalyticsStart(date)}
              className="border rounded px-2 py-1"
              dateFormat="yyyy-MM-dd"
              placeholderText="Start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <DatePicker
              selected={analyticsEnd}
              onChange={date => setAnalyticsEnd(date)}
              className="border rounded px-2 py-1"
              dateFormat="yyyy-MM-dd"
              placeholderText="End date"
            />
          </div>
          <button
            className="ml-auto px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={exportToCSV}
          >
            Export CSV
          </button>
        </div>
        <canvas ref={analyticsChartRef} height={120}></canvas>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className={`${stat.changeColor} text-sm`}>{stat.change}</p>
              </div>
              <FontAwesomeIcon icon={stat.icon} className={`text-3xl ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
      {/* Admin Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">User Management</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Add New User
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faUserCog} className="mr-2" /> Manage Permissions
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faBan} className="mr-2" /> Blocked Users
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Service Management</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faPlusCircle} className="mr-2" /> Add Service Category
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" /> Verify Providers
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faStar} className="mr-2" /> Top Performers
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Financial Controls</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faPercentage} className="mr-2" /> Commission Settings
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faFileInvoice} className="mr-2" /> Generate Reports
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              <FontAwesomeIcon icon={faMoneyCheck} className="mr-2" /> Refund Management
            </button>
          </div>
        </div>
      </div>
      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="font-bold text-lg mb-4">Revenue Analytics</h3>
        <canvas ref={revenueChartRef} width="400" height="150"></canvas>
      </div>
      {/* Admin Data Tables */}
      <UserTable users={users} />
      {usersLoading && <Spinner className="my-4" />}
      <ProviderTable providers={providers} />
      {providersLoading && <Spinner className="my-4" />}
      <BookingTable bookings={bookings} />
      {bookingsLoading && <Spinner className="my-4" />}
      <ComplaintTable complaints={complaints} />
      {complaintsLoading && <Spinner className="my-4" />}
      {/* Materials Section */}
      <MaterialTable />
      {/* Admins Section */}
      <AdminTable />
      {/* Audit Logs Section */}
      <AuditLogTable />
      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h3 className="font-bold text-lg mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center mr-3`}>
                  <FontAwesomeIcon icon={activity.icon} className={activity.iconColor} />
                </div>
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.subtitle}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 