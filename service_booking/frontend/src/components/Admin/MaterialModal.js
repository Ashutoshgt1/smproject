import React, { useState, useEffect } from 'react';

const MaterialModal = ({ open, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({ name: '', qrCode: '', price: '', unit: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', qrCode: '', price: '', unit: '' });
    setError('');
  }, [open, initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.qrCode) {
      setError('Name and QR Code are required.');
      return;
    }
    onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{initialData ? 'Edit Material' : 'Add Material'}</h3>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">QR Code</label>
          <input name="qrCode" value={form.qrCode} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Price</label>
          <input name="price" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" type="number" min="0" step="0.01" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Unit</label>
          <input name="unit" value={form.unit} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">{initialData ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
};

export default MaterialModal; 