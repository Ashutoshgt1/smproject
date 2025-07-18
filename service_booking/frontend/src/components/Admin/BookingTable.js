import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const pageSizeOptions = [10, 20, 50];

function exportToCSV(bookings) {
  const headers = ['ID', 'Customer', 'Service', 'Status', 'Assigned Provider', 'Scheduled Time', 'Created'];
  const rows = bookings.map(b => [
    b.id,
    b.customer?.username || '-',
    b.service,
    b.status,
    b.assigned_provider?.username || '-',
    b.scheduled_time || '',
    new Date(b.created_at).toLocaleString(),
  ]);
  let csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bookings.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const BookingTable = ({ bookings, fetchBookings, allProviders }) => {
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', provider: '', customer: '', created_from: '', created_to: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [confirmModal, setConfirmModal] = useState({ open: false, bookingId: null });

  // Filtering, sorting, and pagination logic would be handled by backend in real app
  // Here, we just filter/sort/paginate locally for demo
  let filtered = bookings.filter(b =>
    (!filters.status || b.status === filters.status) &&
    (!filters.search || b.service.toLowerCase().includes(filters.search.toLowerCase()) || String(b.id) === filters.search) &&
    (!filters.provider || (b.assigned_provider && b.assigned_provider.username.toLowerCase().includes(filters.provider.toLowerCase()))) &&
    (!filters.customer || (b.customer && b.customer.username.toLowerCase().includes(filters.customer.toLowerCase()))) &&
    (!filters.created_from || new Date(b.created_at) >= new Date(filters.created_from)) &&
    (!filters.created_to || new Date(b.created_at) <= new Date(filters.created_to))
  );
  filtered = filtered.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortOrder === 'desc') [aVal, bVal] = [bVal, aVal];
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal);
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSelect = id => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelected([]);
      setSelectAll(false);
    } else {
      setSelected(filtered.map(b => b.id));
      setSelectAll(true);
    }
  };
  const handleBulkAction = () => {
    if (!bulkAction || selected.length === 0) return;
    setActionLoading(true);
    setActionError(null);
    let update = {};
    if (bulkAction === 'status') update.status = bulkValue;
    if (bulkAction === 'provider') update.assigned_provider_id = bulkValue;
    fetch('/api/admin/bookings/bookings/bulk_update/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, update })
    })
      .then(res => {
        if (!res.ok) throw new Error('Bulk update failed');
        setSelected([]);
        setSelectAll(false);
        setBulkAction('');
        setBulkValue('');
        fetchBookings && fetchBookings();
      })
      .catch(err => setActionError(err.message))
      .finally(() => setActionLoading(false));
  };
  const handleSort = field => {
    if (sortField === field) setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  const handleCancel = (id) => {
    setConfirmModal({ open: true, bookingId: id });
  };
  const doCancel = (id) => {
    setActionLoading(true);
    setActionError(null);
    fetch(`/api/admin/bookings/bookings/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to cancel booking');
        fetchBookings && fetchBookings();
      })
      .catch(err => setActionError(err.message))
      .finally(() => setActionLoading(false));
    setConfirmModal({ open: false, bookingId: null });
  };
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <ConfirmationModal
        open={confirmModal.open}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        onConfirm={() => doCancel(confirmModal.bookingId)}
        onCancel={() => setConfirmModal({ open: false, bookingId: null })}
      />
      <h3 className="font-bold text-lg mb-4">Bookings</h3>
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1">
          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <input type="text" placeholder="Search service or ID" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="border rounded px-2 py-1" />
        <input type="text" placeholder="Provider" value={filters.provider} onChange={e => setFilters(f => ({ ...f, provider: e.target.value }))} className="border rounded px-2 py-1" />
        <input type="text" placeholder="Customer" value={filters.customer} onChange={e => setFilters(f => ({ ...f, customer: e.target.value }))} className="border rounded px-2 py-1" />
        <input type="date" value={filters.created_from} onChange={e => setFilters(f => ({ ...f, created_from: e.target.value }))} className="border rounded px-2 py-1" />
        <input type="date" value={filters.created_to} onChange={e => setFilters(f => ({ ...f, created_to: e.target.value }))} className="border rounded px-2 py-1" />
        <button className="ml-2 px-2 py-1 bg-gray-100 rounded" onClick={() => setFilters({ status: '', search: '', provider: '', customer: '', created_from: '', created_to: '' })}>Reset</button>
        <button className="ml-2 px-2 py-1 bg-green-100 rounded" onClick={() => exportToCSV(filtered)}>Export CSV</button>
      </div>
      {/* Bulk Actions */}
      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
        <span className="text-sm">Select All</span>
        <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Bulk Action</option>
          <option value="status">Change Status</option>
          <option value="provider">Assign Provider</option>
        </select>
        {bulkAction === 'status' && (
          <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="border rounded px-2 py-1">
            {statusOptions.filter(opt => opt.value).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        )}
        {bulkAction === 'provider' && (
          <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Select Provider</option>
            {allProviders && allProviders.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
          </select>
        )}
        <button className="ml-2 px-2 py-1 bg-blue-100 rounded" disabled={actionLoading || !bulkAction || !bulkValue || selected.length === 0} onClick={handleBulkAction}>Apply</button>
        {actionLoading && <span className="ml-2 text-blue-500">Processing...</span>}
        {actionError && <span className="ml-2 text-red-500">{actionError}</span>}
      </div>
      {/* Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('id')}>ID</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('customer')}>Customer</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('service')}>Service</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('status')}>Status</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('assigned_provider')}>Assigned Provider</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('scheduled_time')}>Scheduled Time</th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('created_at')}>Created</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(booking => (
            <tr key={booking.id} className={selected.includes(booking.id) ? 'bg-blue-50' : ''}>
              <td className="px-4 py-2"><input type="checkbox" checked={selected.includes(booking.id)} onChange={() => handleSelect(booking.id)} /></td>
              <td className="px-4 py-2">{booking.id}</td>
              <td className="px-4 py-2">{booking.customer?.username || '-'}</td>
              <td className="px-4 py-2">{booking.service}</td>
              <td className="px-4 py-2">{booking.status}</td>
              <td className="px-4 py-2">{booking.assigned_provider?.username || '-'}</td>
              <td className="px-4 py-2">{booking.scheduled_time ? new Date(booking.scheduled_time).toLocaleString() : '-'}</td>
              <td className="px-4 py-2">{new Date(booking.created_at).toLocaleString()}</td>
              <td className="px-4 py-2">
                {booking.status !== 'cancelled' && (
                  <button
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    onClick={() => handleCancel(booking.id)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <span className="text-sm">Page {page} of {Math.ceil(total / pageSize)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="px-2 py-1 border rounded" disabled={page === Math.ceil(total / pageSize)} onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}>Next</button>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
            {pageSizeOptions.map(size => <option key={size} value={size}>{size} / page</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BookingTable; 