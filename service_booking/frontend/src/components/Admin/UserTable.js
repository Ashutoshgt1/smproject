import React from 'react';

const UserTable = ({ users }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-8">
    <h3 className="font-bold text-lg mb-4">Users</h3>
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-2">ID</th>
          <th className="px-4 py-2">Username</th>
          <th className="px-4 py-2">Email</th>
          <th className="px-4 py-2">Active</th>
          <th className="px-4 py-2">Staff</th>
          <th className="px-4 py-2">Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td className="px-4 py-2">{user.id}</td>
            <td className="px-4 py-2">{user.username}</td>
            <td className="px-4 py-2">{user.email}</td>
            <td className="px-4 py-2">{user.is_active ? 'Yes' : 'No'}</td>
            <td className="px-4 py-2">{user.is_staff ? 'Yes' : 'No'}</td>
            <td className="px-4 py-2">{new Date(user.date_joined).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default UserTable; 