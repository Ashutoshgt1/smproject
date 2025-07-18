import React, { useEffect, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import Spinner from './Spinner';
import MaterialModal from './MaterialModal';
import { toast } from 'react-hot-toast';

const MaterialTable = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, materialId: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const fetchMaterials = () => {
    setLoading(true);
    fetch('/api/admin/accounts/materials/')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch materials');
        return res.json();
      })
      .then(data => setMaterials(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = (id) => {
    setConfirmModal({ open: true, materialId: id });
  };
  const doDelete = (id) => {
    setActionLoading(true);
    fetch(`/api/admin/accounts/materials/${id}/`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete material');
        setMaterials(materials => materials.filter(m => m.id !== id));
        toast.success('Material deleted');
      })
      .catch(err => {
        setError(err.message);
        toast.error('Failed to delete material');
      })
      .finally(() => {
        setActionLoading(false);
        setConfirmModal({ open: false, materialId: null });
      });
  };

  const handleAdd = () => {
    setEditMaterial(null);
    setModalOpen(true);
  };
  const handleEdit = (material) => {
    setEditMaterial(material);
    setModalOpen(true);
  };
  const handleSave = (form) => {
    setActionLoading(true);
    const method = editMaterial ? 'PUT' : 'POST';
    const url = editMaterial
      ? `/api/admin/accounts/materials/${editMaterial.id}/`
      : '/api/admin/accounts/materials/';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save material');
        return res.json();
      })
      .then(data => {
        toast.success(editMaterial ? 'Material updated' : 'Material added');
        setModalOpen(false);
        setEditMaterial(null);
        fetchMaterials();
      })
      .catch(err => {
        setError(err.message);
        toast.error('Failed to save material');
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
      setSelected(materials.map(m => m.id));
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
      fetch(`/api/admin/accounts/materials/${id}/`, { method: 'DELETE' })
    ))
      .then(responses => {
        if (responses.some(res => !res.ok)) throw new Error('Some deletions failed');
        setMaterials(materials => materials.filter(m => !selected.includes(m.id)));
        setSelected([]);
        setSelectAll(false);
        toast.success('Materials deleted');
      })
      .catch(() => toast.error('Failed to delete some materials'))
      .finally(() => {
        setActionLoading(false);
        setBulkConfirm(false);
      });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <MaterialModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMaterial(null); }}
        onSave={handleSave}
        initialData={editMaterial}
      />
      <ConfirmationModal
        open={confirmModal.open}
        title="Delete Material?"
        message="Are you sure you want to delete this material? This action cannot be undone."
        onConfirm={() => doDelete(confirmModal.materialId)}
        onCancel={() => setConfirmModal({ open: false, materialId: null })}
      />
      <ConfirmationModal
        open={bulkConfirm}
        title="Delete Materials?"
        message={`Are you sure you want to delete ${selected.length} materials? This action cannot be undone.`}
        onConfirm={doBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Materials</h3>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={handleAdd}
          >
            Add Material
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
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">QR Code</th>
            <th className="px-4 py-2">Price</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(material => (
            <tr key={material.id} className={selected.includes(material.id) ? 'bg-blue-50' : ''}>
              <td className="px-4 py-2"><input type="checkbox" checked={selected.includes(material.id)} onChange={() => handleSelect(material.id)} /></td>
              <td className="px-4 py-2">{material.id}</td>
              <td className="px-4 py-2">{material.name}</td>
              <td className="px-4 py-2">{material.qrCode}</td>
              <td className="px-4 py-2">{material.price}</td>
              <td className="px-4 py-2">{material.unit}</td>
              <td className="px-4 py-2 flex gap-2">
                <button
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  onClick={() => handleEdit(material)}
                  disabled={actionLoading}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  onClick={() => handleDelete(material.id)}
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

export default MaterialTable; 