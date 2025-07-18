import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../config/api';

const CustomerComplaints = ({ userId }) => {
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ booking: '', category: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchBookings();
  }, [userId]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/', { withCredentials: true });
      setComplaints(res.data.filter(c => c.customer && c.customer.id === userId));
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/', { withCredentials: true });
      setBookings(res.data.bookings || []);
    } catch {
      setBookings([]);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/complaints/', form, { withCredentials: true });
      toast.success('Complaint submitted!');
      setForm({ booking: '', category: '', description: '' });
      fetchComplaints();
    } catch {
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Support / Complaints</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mb-8 bg-gray-50 rounded p-4">
        <div>
          <label htmlFor="booking-select" className="block font-medium mb-1">Related Booking</label>
          <select id="booking-select" name="booking" value={form.booking} onChange={handleChange} className="border rounded px-3 py-2 w-full">
            <option value="">-- Select Booking (optional) --</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>#{b.id} - {b.service?.name} ({b.status})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category-input" className="block font-medium mb-1">Category</label>
          <input id="category-input" name="category" value={form.category} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="e.g. Service Issue, Payment, Other" required />
        </div>
        <div>
          <label htmlFor="description-input" className="block font-medium mb-1">Description</label>
          <textarea id="description-input" name="description" value={form.description} onChange={handleChange} className="border rounded px-3 py-2 w-full" rows={3} placeholder="Describe your issue..." required />
        </div>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
      <h3 className="text-lg font-bold mb-2">My Complaints</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2">ID</th>
              <th className="px-2 py-2">Booking</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id}>
                <td className="px-2 py-2">{c.id}</td>
                <td className="px-2 py-2">{c.booking ? `#${c.booking}` : '-'}</td>
                <td className="px-2 py-2">{c.category}</td>
                <td className="px-2 py-2">{c.status || '-'}</td>
                <td className="px-2 py-2">{c.description}</td>
                <td className="px-2 py-2">{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerComplaints; 