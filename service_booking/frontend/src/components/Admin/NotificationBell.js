import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  return `${protocol}://${host}/ws/admin/notifications/`;
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bellRef = useRef(null);
  const wsRef = useRef(null);

  const fetchNotifications = () => {
    fetch('/api/admin/accounts/notifications/?ordering=-timestamp&read=false')
      .then(res => res.json())
      .then(data => setNotifications(data));
  };

  useEffect(() => {
    fetchNotifications();
    // Optionally poll for new notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time notifications
  useEffect(() => {
    wsRef.current = new window.WebSocket(getWebSocketUrl());
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications(prev => [data.notification, ...prev]);
        toast.success('New notification received!');
      }
    };
    wsRef.current.onclose = () => {
      // Optionally reconnect
    };
    return () => wsRef.current && wsRef.current.close();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const markAsRead = (id) => {
    fetch(`/api/admin/accounts/notifications/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true })
    }).then(() => fetchNotifications());
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={() => setDropdownOpen(open => !open)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b font-bold">Notifications</div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="p-4 text-gray-500 text-center">No new notifications</li>
            )}
            {notifications.map(n => (
              <li key={n.id} className="flex items-start gap-2 p-4 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium text-sm">{n.type.replace(/_/g, ' ')}</div>
                  <div className="text-gray-700 text-xs mb-1">{n.message}</div>
                  <div className="text-gray-400 text-xs">{new Date(n.timestamp).toLocaleString()}</div>
                </div>
                <button
                  className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  onClick={() => markAsRead(n.id)}
                >
                  Mark as read
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 text-center">
            <a href="#/admin/notifications" className="text-blue-600 hover:underline text-sm">View all notifications</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 