import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const AvailabilityManager = () => {
  const [availability, setAvailability] = useState({});
  const [slotDuration, setSlotDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const defaultTimeSlots = [
    { from: '09:00', to: '12:00' },
    { from: '14:00', to: '18:00' }
  ];

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await api.get('/accounts/provider/availability/');
      setAvailability(response.data.availability || {});
      setSlotDuration(response.data.slot_duration || 60);
      setBufferTime(response.data.buffer_time || 15);
    } catch (error) {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setAvailability(prev => {
      if (prev[day]) {
        const { [day]: removed, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [day]: [...defaultTimeSlots] };
      }
    });
  };

  const handleTimeChange = (day, slotIndex, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((slot, index) => 
        index === slotIndex ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const addTimeSlot = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { from: '09:00', to: '17:00' }]
    }));
  };

  const removeTimeSlot = (day, slotIndex) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].filter((_, index) => index !== slotIndex)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/accounts/provider/availability/', {
        availability,
        slot_duration: slotDuration,
        buffer_time: bufferTime
      });
      toast.success('Availability updated successfully!');
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="availability-manager">
      <div className="manager-header">
        <h2><Clock size={24} /> Manage Your Availability</h2>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="loading-spinner"></span>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="settings-row">
        <div className="setting-group">
          <label>Slot Duration (minutes)</label>
          <select 
            value={slotDuration} 
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="form-control"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>Buffer Time (minutes)</label>
          <select 
            value={bufferTime} 
            onChange={(e) => setBufferTime(Number(e.target.value))}
            className="form-control"
          >
            <option value={0}>No buffer</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
          </select>
        </div>
      </div>

      <div className="info-box">
        <AlertCircle size={16} />
        <span>Set your working hours for each day. Customers can only book during these times.</span>
      </div>

      <div className="availability-grid">
        {days.map(day => (
          <div key={day} className={`day-card ${availability[day] ? 'active' : ''}`}>
            <div className="day-header">
              <label className="day-toggle">
                <input
                  type="checkbox"
                  checked={!!availability[day]}
                  onChange={() => handleDayToggle(day)}
                />
                <span className="day-name">{day}</span>
              </label>
            </div>
            
            {availability[day] && (
              <div className="time-slots">
                {availability[day].map((slot, index) => (
                  <div key={index} className="time-slot">
                    <input
                      type="time"
                      value={slot.from}
                      onChange={(e) => handleTimeChange(day, index, 'from', e.target.value)}
                      className="time-input"
                    />
                    <span className="time-separator">to</span>
                    <input
                      type="time"
                      value={slot.to}
                      onChange={(e) => handleTimeChange(day, index, 'to', e.target.value)}
                      className="time-input"
                    />
                    {availability[day].length > 1 && (
                      <button
                        className="btn-remove"
                        onClick={() => removeTimeSlot(day, index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="btn-add-slot"
                  onClick={() => addTimeSlot(day)}
                >
                  + Add time slot
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .availability-manager {
          background: white;
          border-radius: 12px;
          padding: 32px;
          margin: 20px 0;
        }
        
        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .manager-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }
        
        .settings-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .setting-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }
        
        .info-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          margin-bottom: 32px;
          color: #1e40af;
        }
        
        .availability-grid {
          display: grid;
          gap: 16px;
        }
        
        .day-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        
        .day-card.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .day-header {
          margin-bottom: 16px;
        }
        
        .day-toggle {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
        }
        
        .day-toggle input {
          margin-right: 12px;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .time-slots {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .time-slot {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .time-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .time-separator {
          color: #6b7280;
        }
        
        .btn-remove {
          width: 32px;
          height: 32px;
          border: 1px solid #ef4444;
          background: white;
          color: #ef4444;
          border-radius: 4px;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .btn-remove:hover {
          background: #ef4444;
          color: white;
        }
        
        .btn-add-slot {
          padding: 8px 16px;
          border: 1px dashed #3b82f6;
          background: transparent;
          color: #3b82f6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .btn-add-slot:hover {
          background: #eff6ff;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }
      `}</style>
    </div>
  );
};

export default AvailabilityManager; 