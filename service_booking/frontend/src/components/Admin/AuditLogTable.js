import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AuditLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    let url = '/api/admin/accounts/auditlogs/?ordering=timestamp';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (start) url += `&timestamp__gte=${start.toISOString().slice(0, 10)}`;
    if (end) url += `&timestamp__lte=${end.toISOString().slice(0, 10)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => { fetchLogs(); }, [search, start, end]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <h3 className="font-bold text-lg mb-4">Audit Logs</h3>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search user, action, target..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <DatePicker
          selected={start}
          onChange={date => setStart(date)}
          className="border rounded px-2 py-1"
          dateFormat="yyyy-MM-dd"
          placeholderText="Start date"
        />
        <DatePicker
          selected={end}
          onChange={date => setEnd(date)}
          className="border rounded px-2 py-1"
          dateFormat="yyyy-MM-dd"
          placeholderText="End date"
        />
        <button
          className="px-3 py-1 bg-gray-100 rounded"
          onClick={() => { setSearch(''); setStart(null); setEnd(null); }}
        >
          Reset
        </button>
      </div>
      {loading && <Spinner className="my-4" />}
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target Type</th>
              <th className="px-4 py-2">Target ID</th>
              <th className="px-4 py-2">Details</th>
              <th className="px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-4 py-2">{log.user?.username || '-'}</td>
                <td className="px-4 py-2">{log.action}</td>
                <td className="px-4 py-2">{log.target_type}</td>
                <td className="px-4 py-2">{log.target_id}</td>
                <td className="px-4 py-2 text-xs whitespace-pre-wrap max-w-xs">{JSON.stringify(log.details, null, 2)}</td>
                <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable; 