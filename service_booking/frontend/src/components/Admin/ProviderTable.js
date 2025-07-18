import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const ProviderTable = ({ providers }) => {
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});
  const [confirmModal, setConfirmModal] = useState({ open: false, providerId: null });

  const handleApproval = (id, approve) => {
    if (!approve) {
      // Show confirmation modal for rejection
      setConfirmModal({ open: true, providerId: id });
      return;
    }
    doApproval(id, approve);
  };

  const doApproval = (id, approve) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setActionError(prev => ({ ...prev, [id]: null }));
    fetch(`/api/admin/accounts/providers/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_approved: approve })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update approval status');
        window.location.reload(); // For simplicity, reload to refresh data
      })
      .catch(err => setActionError(prev => ({ ...prev, [id]: err.message })))
      .finally(() => setActionLoading(prev => ({ ...prev, [id]: false })));
  };

  const handleConfirmReject = () => {
    if (confirmModal.providerId) {
      doApproval(confirmModal.providerId, false);
    }
    setConfirmModal({ open: false, providerId: null });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <ConfirmationModal
        open={confirmModal.open}
        title="Reject Provider?"
        message="Are you sure you want to reject this provider? This action cannot be undone."
        onConfirm={handleConfirmReject}
        onCancel={() => setConfirmModal({ open: false, providerId: null })}
      />
      <h3 className="font-bold text-lg mb-4">Service Providers</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Available</th>
            <th className="px-4 py-2">Rating</th>
            <th className="px-4 py-2">Last Active</th>
            <th className="px-4 py-2">Approved</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map(provider => (
            <tr key={provider.id}>
              <td className="px-4 py-2">{provider.id}</td>
              <td className="px-4 py-2">{provider.user?.username || '-'}</td>
              <td className="px-4 py-2">{provider.category}</td>
              <td className="px-4 py-2">{provider.is_available ? 'Yes' : 'No'}</td>
              <td className="px-4 py-2">{provider.rating}</td>
              <td className="px-4 py-2">{provider.last_active ? new Date(provider.last_active).toLocaleString() : '-'}</td>
              <td className="px-4 py-2">
                {provider.is_approved ? (
                  <span className="text-green-600 font-semibold">Approved</span>
                ) : (
                  <span className="text-yellow-600 font-semibold">Pending</span>
                )}
              </td>
              <td className="px-4 py-2">
                {provider.is_approved ? (
                  <button
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 mr-2"
                    disabled={actionLoading[provider.id]}
                    onClick={() => handleApproval(provider.id, false)}
                  >
                    {actionLoading[provider.id] ? 'Rejecting...' : 'Reject'}
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 mr-2"
                    disabled={actionLoading[provider.id]}
                    onClick={() => handleApproval(provider.id, true)}
                  >
                    {actionLoading[provider.id] ? 'Approving...' : 'Approve'}
                  </button>
                )}
                {actionError[provider.id] && (
                  <span className="text-red-500 text-xs ml-2">{actionError[provider.id]}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProviderTable; 