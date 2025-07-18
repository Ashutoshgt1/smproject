import React, { useState } from 'react';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const ComplaintTable = ({ complaints }) => {
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});
  const [editNote, setEditNote] = useState({});

  const handleStatusChange = (id, status) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setActionError(prev => ({ ...prev, [id]: null }));
    fetch(`/api/admin/reviews/complaints/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update status');
        window.location.reload();
      })
      .catch(err => setActionError(prev => ({ ...prev, [id]: err.message })))
      .finally(() => setActionLoading(prev => ({ ...prev, [id]: false })));
  };

  const handleNoteSave = (id, note) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setActionError(prev => ({ ...prev, [id]: null }));
    fetch(`/api/admin/reviews/complaints/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update note');
        window.location.reload();
      })
      .catch(err => setActionError(prev => ({ ...prev, [id]: err.message })))
      .finally(() => setActionLoading(prev => ({ ...prev, [id]: false })));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <h3 className="font-bold text-lg mb-4">Complaints</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Booking</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Admin Note</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map(complaint => (
            <tr key={complaint.id}>
              <td className="px-4 py-2">{complaint.id}</td>
              <td className="px-4 py-2">{complaint.booking}</td>
              <td className="px-4 py-2">{complaint.description}</td>
              <td className="px-4 py-2">
                <select
                  value={complaint.status}
                  onChange={e => handleStatusChange(complaint.id, e.target.value)}
                  disabled={actionLoading[complaint.id]}
                  className="border rounded px-2 py-1"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2">
                <textarea
                  className="border rounded px-2 py-1 w-full"
                  rows={2}
                  value={editNote[complaint.id] !== undefined ? editNote[complaint.id] : (complaint.admin_note || '')}
                  onChange={e => setEditNote(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                  disabled={actionLoading[complaint.id]}
                />
                <button
                  className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                  disabled={actionLoading[complaint.id]}
                  onClick={() => handleNoteSave(complaint.id, editNote[complaint.id] !== undefined ? editNote[complaint.id] : (complaint.admin_note || ''))}
                >
                  {actionLoading[complaint.id] ? 'Saving...' : 'Save'}
                </button>
              </td>
              <td className="px-4 py-2">{new Date(complaint.created_at).toLocaleString()}</td>
              <td className="px-4 py-2">
                {actionError[complaint.id] && (
                  <span className="text-red-500 text-xs">{actionError[complaint.id]}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintTable; 