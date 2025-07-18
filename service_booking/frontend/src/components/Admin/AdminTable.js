import React, { useEffect, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import Spinner from './Spinner';
import AdminModal from './AdminModal';
import { toast } from 'react-hot-toast';

const getCurrentUserId = () => {
  // This function should return the current logged-in user's ID.
  // Replace with your actual auth logic if needed.
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
  } catch {
    return null;
  }
};

const AdminTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, adminId: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const currentUserId = getCurrentUserId();

  const fetchAdmins = () => {
    setLoading(true);
    fetch('/api/admin/accounts/admins/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch admins');
        return res.json();
      })
      .then(data => setAdmins(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = (id) => {
    setConfirmModal({ open: true, adminId: id });
  };
  const doDelete = (id) => {
    setActionLoading(true);
    fetch(`/api/admin/accounts/admins/${id}/`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete admin');
        setAdmins(admins => admins.filter(a => a.id !== id));
        toast.success('Admin deleted');
      })
      .catch(err => {
        setError(err.message);
        toast.error('Failed to delete admin');
      })
      .finally(() => {
        setActionLoading(false);
        setConfirmModal({ open: false, adminId: null });
      });
  };

  const handleAdd = () => {
    setEditAdmin(null);
    setModalOpen(true);
  };
  const handleEdit = (admin) => {
    setEditAdmin(admin);
    setModalOpen(true);
  };
  const handleSave = (form) => {
    setActionLoading(true);
    const method = editAdmin ? 'PUT' : 'POST';
    const url = editAdmin
      ? `/api/admin/accounts/admins/${editAdmin.id}/`
      : '/api/admin/accounts/admins/';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save admin');
        return res.json();
      })
      .then(data => {
        toast.success(editAdmin ? 'Admin updated' : 'Admin added');
        setModalOpen(false);
        setEditAdmin(null);
        fetchAdmins();
      })
      .catch(err => {
        setError(err.message);
        toast.error('Failed to save admin');
      })
      .finally(() => setActionLoading(false));
  };

  const handleSelect = id => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelected([]);
      setSelectAll(false);
    } else {
      setSelected(admins.map(a => a.id));
      setSelectAll(true);
    }
  };
  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setBulkConfirm(true);
  };
  const doBulkDelete = () => {
    setActionLoading(true);
    Promise.all(selected.map(id =>
      fetch(`/api/admin/accounts/admins/${id}/`, { method: 'DELETE' })
    ))
      .then(responses => {
        if (responses.some(res => !res.ok)) throw new Error('Some deletions failed');
        setAdmins(admins => admins.filter(a => !selected.includes(a.id)));
        setSelected([]);
        setSelectAll(false);
        toast.success('Admins deleted');
      })
      .catch(() => toast.error('Failed to delete some admins'))
      .finally(() => {
        setActionLoading(false);
        setBulkConfirm(false);
      });
  };

  const handleToggleSuperAdmin = (admin) => {
    if (!window.confirm(`Are you sure you want to ${admin.superAdmin ? 'demote' : 'promote'} this admin?`)) return;
    setActionLoading(true);
    fetch(`/api/admin/accounts/admins/${admin.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ superAdmin: !admin.superAdmin })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update superAdmin status');
        toast.success(`Admin ${!admin.superAdmin ? 'promoted' : 'demoted'} successfully`);
        fetchAdmins();
      })
      .catch(err => {
        setError(err.message);
        toast.error('Failed to update superAdmin status');
      })
      .finally(() => setActionLoading(false));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <AdminModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditAdmin(null); }}
        onSave={handleSave}
        initialData={editAdmin}
      />
      <ConfirmationModal
        open={confirmModal.open}
        title="Delete Admin?"
        message="Are you sure you want to delete this admin? This action cannot be undone."
        onConfirm={() => doDelete(confirmModal.adminId)}
        onCancel={() => setConfirmModal({ open: false, adminId: null })}
      />
      <ConfirmationModal
        open={bulkConfirm}
        title="Delete Admins?"
        message={`Are you sure you want to delete ${selected.length} admins? This action cannot be undone.`}
        onConfirm={doBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Admins</h3>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={handleAdd}
          >
            Add Admin
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
            onClick={handleBulkDelete}
            disabled={selected.length === 0 || actionLoading}
          >
            Bulk Delete
          </button>
        </div>
      </div>
      {loading && <Spinner className="my-4" />}
      {error && <p className="text-red-500">{error}</p>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Username</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Super Admin</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id} className={selected.includes(admin.id) ? 'bg-blue-50' : ''}>
              <td className="px-4 py-2"><input type="checkbox" checked={selected.includes(admin.id)} onChange={() => handleSelect(admin.id)} /></td>
              <td className="px-4 py-2">{admin.id}</td>
              <td className="px-4 py-2">{admin.user?.username || '-'}</td>
              <td className="px-4 py-2">{admin.phone}</td>
              <td className="px-4 py-2">
                <span className={admin.superAdmin ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                  {admin.superAdmin ? 'Yes' : 'No'}
                </span>
                <button
                  className={`ml-2 px-2 py-1 rounded ${admin.superAdmin ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  onClick={() => handleToggleSuperAdmin(admin)}
                  disabled={currentUserId === admin.user?.id}
                  title={admin.superAdmin ? 'Demote from Super Admin' : 'Promote to Super Admin'}
                >
                  {admin.superAdmin ? 'Demote' : 'Promote'}
                </button>
              </td>
              <td className="px-4 py-2">{new Date(admin.created_at).toLocaleString()}</td>
              <td className="px-4 py-2 flex gap-2">
                <button
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  onClick={() => handleEdit(admin)}
                  disabled={actionLoading}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  onClick={() => handleDelete(admin.id)}
                  disabled={actionLoading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable; 