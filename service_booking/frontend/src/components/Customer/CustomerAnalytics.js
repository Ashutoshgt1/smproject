import React, { useEffect, useState } from 'react';
import api from '../../config/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e42', '#ef4444', '#6366f1', '#fbbf24'];

const CustomerAnalytics = ({ userId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/', { withCredentials: true });
      setBookings((res.data.bookings || []).filter(b => b.customer?.user?.id === userId));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalBookings = bookings.length;
  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([status, count], i) => ({ name: status, value: count, color: COLORS[i % COLORS.length] }));

  // Spending over time (by month)
  const spendingByMonth = {};
  bookings.forEach(b => {
    if (b.payment_details?.amount && b.scheduled_time) {
      const date = new Date(b.scheduled_time);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      spendingByMonth[key] = (spendingByMonth[key] || 0) + (b.payment_details.amount || 0);
    }
  });
  const spendingData = Object.entries(spendingByMonth).map(([month, amount]) => ({ month, amount }));

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">My Analytics</h2>
      {loading ? (
        <div className="text-blue-500">Loading analytics...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex-1 min-w-[160px] bg-blue-50 rounded p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{totalBookings}</div>
              <div className="text-gray-700">Total Bookings</div>
            </div>
            <div className="flex-1 min-w-[160px] bg-green-50 rounded p-4 text-center">
              <div className="text-3xl font-bold text-green-600">₹{bookings.reduce((sum, b) => sum + (b.payment_details?.amount || 0), 0)}</div>
              <div className="text-gray-700">Total Spending</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Bookings by Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {statusData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Spending Over Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={spendingData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerAnalytics; 