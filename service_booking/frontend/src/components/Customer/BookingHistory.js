import React, { useEffect, useState } from 'react';
import Spinner from '../Admin/Spinner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function exportToCSV(bookings) {
  const headers = ['ID', 'Service', 'Provider', 'Status', 'Scheduled Time', 'Amount'];
  const rows = bookings.map(b => [
    b.id,
    b.service?.name || '-',
    b.provider?.user?.username || '-',
    b.status,
    b.scheduled_time ? new Date(b.scheduled_time).toLocaleString() : '-',
    b.payment_details?.amount || '-',
  ]);
  let csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'booking_history.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const BookingHistory = ({ userId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [reviewModal, setReviewModal] = useState({ open: false, booking: null });
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState([]);
  const [lastPaymentStatuses, setLastPaymentStatuses] = useState({});

  const fetchBookings = () => {
    setLoading(true);
    let url = '/api/admin/bookings/bookings/?ordering=-scheduled_time';
    if (status) url += `&status=${status}`;
    if (start) url += `&scheduled_from=${start.toISOString().slice(0, 10)}`;
    if (end) url += `&scheduled_to=${end.toISOString().slice(0, 10)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setBookings(data.filter(b => b.customer?.user?.id === userId)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [userId, status, start, end]);

  useEffect(() => {
    // Show toast if payment status changes
    filtered.forEach(booking => {
      const prev = lastPaymentStatuses[booking.id];
      const curr = booking.payment_details?.status;
      if (prev && curr && prev !== curr) {
        if (curr === 'paid') toast.success(`Payment received for booking #${booking.id}`);
        else if (curr === 'failed') toast.error(`Payment failed for booking #${booking.id}`);
      }
    });
    setLastPaymentStatuses(Object.fromEntries(filtered.map(b => [b.id, b.payment_details?.status])));
    // eslint-disable-next-line
  }, [filtered.map(b => b.payment_details?.status).join()]);

  const filtered = bookings.filter(b =>
    (!search ||
      (b.service?.name && b.service.name.toLowerCase().includes(search.toLowerCase())) ||
      (b.provider?.user?.username && b.provider.user.username.toLowerCase().includes(search.toLowerCase())) ||
      String(b.id) === search)
  );

  const openReviewModal = (booking) => {
    setReviewModal({ open: true, booking });
    setReview({ rating: 5, comment: '' });
  };
  const closeReviewModal = () => {
    setReviewModal({ open: false, booking: null });
  };
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Replace with your review API endpoint
      const res = await fetch(`/api/admin/bookings/${reviewModal.booking.id}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: review.rating, comment: review.comment }),
      });
      if (!res.ok) throw new Error();
      setReviewedBookings((prev) => [...prev, reviewModal.booking.id]);
      closeReviewModal();
    } catch {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = (url) => {
    // Open in new tab or trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <h3 className="font-bold text-lg mb-4">Booking History</h3>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-1 min-w-[120px]">
          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search service, provider, or ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-2 py-1 min-w-[180px]"
        />
        <DatePicker
          selected={start}
          onChange={date => setStart(date)}
          className="border rounded px-2 py-1 min-w-[120px]"
          dateFormat="yyyy-MM-dd"
          placeholderText="Start date"
        />
        <DatePicker
          selected={end}
          onChange={date => setEnd(date)}
          className="border rounded px-2 py-1 min-w-[120px]"
          dateFormat="yyyy-MM-dd"
          placeholderText="End date"
        />
        <button className="ml-auto px-2 py-1 bg-green-100 rounded whitespace-nowrap" onClick={() => exportToCSV(filtered)}>Export CSV</button>
      </div>
      {loading && <Spinner className="my-4" />}
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
          <thead>
            <tr>
              <th className="px-2 md:px-4 py-2">ID</th>
              <th className="px-2 md:px-4 py-2">Service</th>
              <th className="px-2 md:px-4 py-2">Provider</th>
              <th className="px-2 md:px-4 py-2">Status</th>
              <th className="px-2 md:px-4 py-2">Scheduled Time</th>
              <th className="px-2 md:px-4 py-2">Amount</th>
              <th className="px-2 md:px-4 py-2">Payment Status</th>
              <th className="px-2 md:px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(booking => (
              <tr key={booking.id}>
                <td className="px-2 md:px-4 py-2">{booking.id}</td>
                <td className="px-2 md:px-4 py-2">{booking.service?.name || '-'}</td>
                <td className="px-2 md:px-4 py-2">{booking.provider?.user?.username || '-'}</td>
                <td className="px-2 md:px-4 py-2">{booking.status}</td>
                <td className="px-2 md:px-4 py-2">{booking.scheduled_time ? new Date(booking.scheduled_time).toLocaleString() : '-'}</td>
                <td className="px-2 md:px-4 py-2">{booking.payment_details?.amount || '-'}</td>
                <td className="px-2 md:px-4 py-2">
                  {booking.payment_details?.status === 'paid' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Paid</span>}
                  {booking.payment_details?.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Pending</span>}
                  {booking.payment_details?.status === 'failed' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Failed</span>}
                  {!booking.payment_details?.status && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">-</span>}
                </td>
                <td className="px-2 md:px-4 py-2 flex flex-wrap gap-2">
                  {booking.status === 'completed' && !reviewedBookings.includes(booking.id) && (
                    <button className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs w-full sm:w-auto" onClick={() => openReviewModal(booking)} aria-label="Leave review for booking">Leave Review</button>
                  )}
                  {booking.status === 'completed' && reviewedBookings.includes(booking.id) && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs w-full sm:w-auto" aria-label="Booking reviewed">Reviewed</span>
                  )}
                  {booking.payment_details?.invoice_url && (
                    <>
                      <a
                        href={booking.payment_details.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs w-full sm:w-auto"
                        aria-label="View invoice for booking"
                      >
                        View Invoice
                      </a>
                      <button
                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs w-full sm:w-auto"
                        onClick={() => handleDownloadInvoice(booking.payment_details.invoice_url)}
                        aria-label="Download invoice for booking"
                        type="button"
                      >
                        Download Invoice
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={closeReviewModal} aria-label="Close review modal">&times;</button>
            <h3 id="review-modal-title" className="text-lg font-bold mb-4">Leave a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4 flex items-center gap-2 justify-center">
                {[1,2,3,4,5].map(star => (
                  <button
                    type="button"
                    key={star}
                    className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                    onClick={() => setReview(r => ({ ...r, rating: star }))}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label htmlFor="review-comment" className="sr-only">Review comment</label>
                <textarea
                  id="review-comment"
                  className="border rounded px-3 py-2 w-full"
                  rows={3}
                  placeholder="Write your feedback..."
                  value={review.comment}
                  onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                  required
                  aria-label="Review comment"
                />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold" disabled={submitting} aria-label="Submit review">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory; 