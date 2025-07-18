import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, Star } from 'lucide-react';
import api from '../../config/api';

const TimeSlotPicker = ({ serviceCategory, selectedDate, onSelectSlot }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    if (serviceCategory && selectedDate) {
      fetchAvailableSlots();
    }
  }, [serviceCategory, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null); // Reset error before fetching
    try {
      const response = await api.post('/accounts/available-slots/', {
        category: serviceCategory,
        date: selectedDate
      });
      setProviders(response.data.providers || []);
    } catch (error) {
      setError('Could not load available slots. Please try again.');
      console.error('Failed to fetch available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (provider, time) => {
    setSelectedProvider(provider);
    setSelectedTime(time);
    onSelectSlot({
      provider_id: provider.id,
      time: time
    });
  };

  const isSlotSelected = (providerId, time) => {
    return selectedProvider?.id === providerId && selectedTime === time;
  };

  if (loading) {
    return (
      <div className="time-slot-picker loading" aria-live="polite">
        <div className="loading-spinner" aria-label="Loading available providers"></div>
        <p>Finding available providers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="time-slot-picker empty" aria-live="polite">
        <Clock size={48} />
        <p>{error}</p>
        <button
          className="retry-btn"
          onClick={fetchAvailableSlots}
          style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
          aria-label="Retry fetching available slots"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!serviceCategory || !selectedDate) {
    return (
      <div className="time-slot-picker empty" aria-live="polite">
        <Calendar size={48} />
        <p>Please select a service and date first</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="time-slot-picker empty" aria-live="polite">
        <Clock size={48} />
        <p>No providers available for the selected date</p>
        <small>Try selecting a different date</small>
      </div>
    );
  }

  return (
    <div className="time-slot-picker p-2 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-2">Available Time Slots</h3>
      <p className="subtitle mb-4">Select a provider and time slot</p>
      <div className="providers-list flex flex-col gap-4">
        {providers.map(({ provider, slots }) => (
          <section key={provider.id} className="provider-card border border-gray-200 rounded-lg p-4 sm:p-6 transition-all hover:border-blue-500 hover:shadow-md" aria-label={`Provider ${provider.name}, rating ${provider.rating.toFixed(1)}`}>
            <div className="provider-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <div className="provider-info flex items-center gap-2">
                <User size={20} />
                <span className="provider-name font-semibold text-gray-700 text-base sm:text-lg">{provider.name}</span>
              </div>
              <div className="provider-rating flex items-center gap-1 text-gray-500">
                <Star size={16} fill="#fbbf24" />
                <span>{provider.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="time-slots-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {slots.map(time => (
                <button
                  key={time}
                  className={`time-slot flex items-center justify-center gap-1 px-2 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 ${isSlotSelected(provider.id, time) ? 'bg-blue-600 border-blue-600 text-white' : ''}`}
                  onClick={() => handleSlotSelect(provider, time)}
                  aria-label={`Select time slot ${time} with provider ${provider.name}`}
                >
                  <Clock size={14} aria-hidden="true" />
                  {time}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <style jsx>{`
        .time-slot-picker {
          background: white;
          border-radius: 12px;
          margin-top: 20px;
        }
        .time-slot-picker.loading,
        .time-slot-picker.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          text-align: center;
          color: #6b7280;
        }
        .time-slot-picker.empty svg {
          margin-bottom: 16px;
          color: #d1d5db;
        }
        .time-slot-picker h3 {
          margin: 0 0 8px 0;
          color: #111827;
        }
        .subtitle {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default TimeSlotPicker; 