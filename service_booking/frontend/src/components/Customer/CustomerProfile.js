import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CustomerProfile = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [passwords, setPasswords] = useState({ old: '', new1: '', new2: '' });
  const [pic, setPic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ label: '', address: '', city: '', state: '', zip_code: '', is_default: false });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/accounts/customers/${userId}/`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm({
          name: data.user?.username || '',
          email: data.user?.email || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await fetch(`/api/addresses/`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAddresses(data);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handlePicChange = e => {
    setPic(e.target.files[0]);
  };
  const handleSave = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/accounts/customers/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('Profile updated!');
      setEditMode(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };
  const handlePasswordChange = async e => {
    e.preventDefault();
    if (passwords.new1 !== passwords.new2) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      // Replace with your password change endpoint
      const res = await fetch(`/api/auth/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: passwords.old, new_password: passwords.new1 }),
      });
      if (!res.ok) throw new Error();
      toast.success('Password changed!');
      setPasswords({ old: '', new1: '', new2: '' });
    } catch {
      toast.error('Failed to change password');
    }
  };
  const handlePicUpload = async e => {
    e.preventDefault();
    if (!pic) return;
    const formData = new FormData();
    formData.append('profile_picture', pic);
    try {
      // Replace with your profile picture upload endpoint
      const res = await fetch(`/api/admin/accounts/customers/${userId}/upload-pic/`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error();
      toast.success('Profile picture updated!');
      setPic(null);
    } catch {
      toast.error('Failed to update profile picture');
    }
  };

  const handleAddressFormChange = e => {
    const { name, value, type, checked } = e.target;
    setAddressForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddressSubmit = async e => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const method = editingAddressId ? 'PATCH' : 'POST';
      const url = editingAddressId ? `/api/addresses/${editingAddressId}/` : '/api/addresses/';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addressForm),
      });
      if (!res.ok) throw new Error();
      toast.success(editingAddressId ? 'Address updated!' : 'Address added!');
      setAddressForm({ label: '', address: '', city: '', state: '', zip_code: '', is_default: false });
      setEditingAddressId(null);
      fetchAddresses();
    } catch {
      toast.error('Failed to save address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleEditAddress = addr => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      zip_code: addr.zip_code || '',
      is_default: addr.is_default || false,
    });
  };

  const handleDeleteAddress = async id => {
    if (!window.confirm('Delete this address?')) return;
    setAddressLoading(true);
    try {
      const res = await fetch(`/api/addresses/${id}/`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      toast.success('Address deleted!');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefault = async id => {
    setAddressLoading(true);
    try {
      const addr = addresses.find(a => a.id === id);
      const res = await fetch(`/api/addresses/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...addr, is_default: true }),
      });
      if (!res.ok) throw new Error();
      toast.success('Default address set!');
      fetchAddresses();
    } catch {
      toast.error('Failed to set default address');
    } finally {
      setAddressLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><span>Loading...</span></div>;

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>
      <form onSubmit={handleSave} className="mb-6 space-y-4">
        <div>
          <label htmlFor="profile-name" className="block font-medium mb-1">Name</label>
          <input id="profile-name" name="name" value={form.name} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm" disabled={!editMode} aria-label="Name" />
        </div>
        <div>
          <label htmlFor="profile-email" className="block font-medium mb-1">Email</label>
          <input id="profile-email" name="email" value={form.email} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm" disabled={!editMode} aria-label="Email" />
        </div>
        <div>
          <label htmlFor="profile-phone" className="block font-medium mb-1">Phone</label>
          <input id="profile-phone" name="phone" value={form.phone} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm" disabled={!editMode} aria-label="Phone" />
        </div>
        <div>
          <label htmlFor="profile-address" className="block font-medium mb-1">Address</label>
          <textarea id="profile-address" name="address" value={form.address} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm" rows={2} disabled={!editMode} aria-label="Address" />
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 w-full sm:w-auto" onClick={() => setEditMode(!editMode)} aria-label={editMode ? 'Cancel editing profile' : 'Edit profile'}>
            {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto" aria-label="Save profile changes">Save</button>}
        </div>
      </form>
      <form onSubmit={handlePasswordChange} className="mb-6 space-y-2">
        <h3 className="font-bold mb-2 text-center">Change Password</h3>
        <div>
          <label htmlFor="profile-old-password" className="sr-only">Old password</label>
          <input id="profile-old-password" type="password" name="old" value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} className="border rounded px-3 py-2 w-full text-sm" placeholder="Old password" aria-label="Old password" />
        </div>
        <div>
          <label htmlFor="profile-new-password" className="sr-only">New password</label>
          <input id="profile-new-password" type="password" name="new1" value={passwords.new1} onChange={e => setPasswords(p => ({ ...p, new1: e.target.value }))} className="border rounded px-3 py-2 w-full text-sm" placeholder="New password" aria-label="New password" />
        </div>
        <div>
          <label htmlFor="profile-repeat-password" className="sr-only">Repeat new password</label>
          <input id="profile-repeat-password" type="password" name="new2" value={passwords.new2} onChange={e => setPasswords(p => ({ ...p, new2: e.target.value }))} className="border rounded px-3 py-2 w-full text-sm" placeholder="Repeat new password" aria-label="Repeat new password" />
        </div>
        <button type="submit" className="w-full px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold" aria-label="Change password">Change Password</button>
      </form>
      <form onSubmit={handlePicUpload} className="mb-6 space-y-2">
        <h3 className="font-bold mb-2 text-center">Profile Picture</h3>
        <label htmlFor="profile-picture-upload" className="sr-only">Profile picture upload</label>
        <input id="profile-picture-upload" type="file" accept="image/*" onChange={handlePicChange} className="mb-2 w-full" aria-label="Profile picture upload" />
        <button type="submit" className="w-full px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold" aria-label="Upload profile picture">Upload</button>
      </form>
      <div className="my-8">
        <h3 className="text-xl font-bold mb-4">Address Book</h3>
        {addressLoading && <div className="text-blue-500 mb-2">Loading addresses...</div>}
        <ul className="space-y-3 mb-4">
          {addresses.map(addr => (
            <li key={addr.id} className="border rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50">
              <div>
                <div className="font-semibold">{addr.label || 'Address'}</div>
                <div className="text-sm text-gray-700">{addr.address}, {addr.city}, {addr.state}, {addr.zip_code}</div>
                {addr.is_default && <span className="text-xs text-green-600 font-bold">Default</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {!addr.is_default && <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded" onClick={() => handleSetDefault(addr.id)}>Set Default</button>}
                <button className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded" onClick={() => handleEditAddress(addr)}>Edit</button>
                <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddressSubmit} className="space-y-2 bg-gray-100 rounded p-3">
          <div className="flex gap-2">
            <input name="label" value={addressForm.label} onChange={handleAddressFormChange} className="border rounded px-2 py-1 w-1/3" placeholder="Label (Home, Work)" />
            <input name="city" value={addressForm.city} onChange={handleAddressFormChange} className="border rounded px-2 py-1 w-1/3" placeholder="City" />
            <input name="state" value={addressForm.state} onChange={handleAddressFormChange} className="border rounded px-2 py-1 w-1/3" placeholder="State" />
          </div>
          <input name="address" value={addressForm.address} onChange={handleAddressFormChange} className="border rounded px-2 py-1 w-full" placeholder="Full Address" />
          <div className="flex gap-2">
            <input name="zip_code" value={addressForm.zip_code} onChange={handleAddressFormChange} className="border rounded px-2 py-1 w-1/2" placeholder="ZIP Code" />
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleAddressFormChange} /> Default
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto">
              {editingAddressId ? 'Update Address' : 'Add Address'}
            </button>
            {editingAddressId && <button type="button" className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold w-full sm:w-auto" onClick={() => { setEditingAddressId(null); setAddressForm({ label: '', address: '', city: '', state: '', zip_code: '', is_default: false }); }}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfile; 