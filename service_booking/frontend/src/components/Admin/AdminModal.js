import React, { useState, useEffect } from 'react';

const AdminModal = ({ open, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({ username: '', phone: '', superAdmin: false, password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) setForm({
      username: initialData.user?.username || '',
      phone: initialData.phone || '',
      superAdmin: initialData.superAdmin || false,
      password: ''
    });
    else setForm({ username: '', phone: '', superAdmin: false, password: '' });
    setError('');
  }, [open, initialData]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.username || !form.phone || (!initialData && !form.password)) {
      setError('Username, phone, and password are required.');
      return;
    }
    onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{initialData ? 'Edit Admin' : 'Add Admin'}</h3>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Username</label>
          <input name="username" value={form.username} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <input type="checkbox" name="superAdmin" checked={form.superAdmin} onChange={handleChange} />
          <label className="text-sm font-medium">Super Admin</label>
        </div>
        {!initialData && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input name="password" value={form.password} onChange={handleChange} className="w-full border rounded px-3 py-2" type="password" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">{initialData ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
};

export default AdminModal; 