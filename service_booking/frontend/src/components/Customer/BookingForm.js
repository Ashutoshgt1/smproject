import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Calendar, FileText, CheckCircle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import TimeSlotPicker from './TimeSlotPicker';
import Spinner from '../Admin/Spinner';

const steps = [
  'Category',
  'Service',
  'Date',
  'Time',
  'Address',
  'Notes',
  'Review',
];

const BookingForm = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [step, setStep] = useState(0);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerFeedback, setProviderFeedback] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState('');

  useEffect(() => {
    fetchSavedAddresses();
    fetchCategories();
    getCurrentLocation();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const res = await api.get('/addresses/', { withCredentials: true });
      setSavedAddresses(res.data);
    } catch {
      setSavedAddresses([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/services/categories/');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const fetchServices = async (categoryId) => {
    try {
      const response = await api.get(`/services/category/${categoryId}/`);
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          setLocation({ lat: 23.0225, lon: 72.5714 });
        }
      );
    }
  };

  // Real-time provider feedback
  useEffect(() => {
    const fetchProviders = async () => {
      if (selectedCategory && selectedService && selectedDate && selectedTimeSlot) {
        setLoadingProviders(true);
        setProviderFeedback('');
        try {
          const response = await api.post('/accounts/available-slots/', {
            category: getCategoryName(),
            date: selectedDate,
            service: selectedService,
            time: selectedTimeSlot.time,
            location: location
          });
          const count = response.data.providers?.length || 0;
          setProviderFeedback(count > 0 ? `${count} providers available for your slot!` : 'No providers available for this slot.');
        } catch {
          setProviderFeedback('Error checking provider availability.');
        } finally {
          setLoadingProviders(false);
        }
      }
    };
    fetchProviders();
    // eslint-disable-next-line
  }, [selectedCategory, selectedService, selectedDate, selectedTimeSlot]);

  const onSubmit = async (data) => {
    if (!selectedTimeSlot) {
      toast.error('Please select a time slot');
      return;
    }
    try {
      const bookingData = {
        service_id: selectedService,
        scheduled_date: selectedDate,
        scheduled_time: selectedTimeSlot.time,
        customer_latitude: location.lat || 23.0225,
        customer_longitude: location.lon || 72.5714,
        customer_address: data.address,
        notes: data.notes
      };
      const response = await api.post('/bookings/request/', bookingData);
      toast.success(`Booking created! ${response.data.notified_providers_count} providers notified.`);
      setSuccessData(response.data);
      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to create booking');
      }
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedService('');
    setSelectedTimeSlot(null);
    setSelectedDate('');
    setStep(1);
    if (categoryId) fetchServices(categoryId);
    else setServices([]);
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setSelectedTimeSlot(null);
    setSelectedDate('');
    setStep(2);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTimeSlot(null);
    setStep(3);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setStep(4);
  };

  const handleSavedAddressSelect = e => {
    const id = e.target.value;
    setSelectedSavedAddress(id);
    const addr = savedAddresses.find(a => a.id === parseInt(id));
    if (addr) {
      setValue('address', `${addr.label ? addr.label + ': ' : ''}${addr.address}, ${addr.city}, ${addr.state}, ${addr.zip_code}`);
    } else {
      setValue('address', '');
    }
  };

  const getCategoryName = () => {
    if (!selectedCategory) return '';
    const category = categories.find(c => c.id === parseInt(selectedCategory));
    return category?.name || '';
  };

  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-2 text-center">
        <CheckCircle className="text-green-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="mb-4">Your booking has been created and providers have been notified.</p>
        <a href="/customer/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go to Dashboard</a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Book a Service</h2>
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-center" aria-label="Booking steps">
        {steps.map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white text-sm ${step >= idx ? 'bg-blue-600' : 'bg-gray-300'}`} aria-label={`Step ${idx + 1}: ${s}`}>{idx + 1}</div>
            {idx < steps.length - 1 && <div className={`h-1 w-6 sm:w-8 ${step > idx ? 'bg-blue-600' : 'bg-gray-300'}`} aria-hidden="true"></div>}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <div className="mb-4">
            <label htmlFor="category-select" className="block font-medium mb-1">Service Category</label>
            <select id="category-select" className="border rounded px-3 py-2 w-full" value={selectedCategory} onChange={handleCategoryChange} required aria-label="Service Category">
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
        {step === 1 && (
          <div className="mb-4">
            <label htmlFor="service-select" className="block font-medium mb-1">Service</label>
            <select id="service-select" className="border rounded px-3 py-2 w-full" value={selectedService} onChange={handleServiceChange} required aria-label="Service">
              <option value="">Select a service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.name} - ₹{service.base_price}</option>
              ))}
            </select>
          </div>
        )}
        {step === 2 && (
          <div className="mb-4">
            <label htmlFor="date-input" className="block font-medium mb-1">Date</label>
            <input id="date-input" type="date" className="border rounded px-3 py-2 w-full" value={selectedDate} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} required aria-label="Date" />
          </div>
        )}
        {step === 3 && selectedService && selectedDate && (
          <div className="mb-4">
            <TimeSlotPicker
              serviceCategory={getCategoryName()}
              selectedDate={selectedDate}
              onSelectSlot={handleTimeSlotSelect}
            />
          </div>
        )}
        {step >= 4 && (
          <div className="mb-4">
            <div className="mb-2">Selected Time: <strong>{selectedTimeSlot?.time}</strong></div>
            {loadingProviders ? <Spinner className="my-2" /> : (
              <div className="text-sm text-blue-600 mb-2" aria-live="polite">{providerFeedback}</div>
            )}
            {/* Address Book Integration */}
            {savedAddresses.length > 0 && (
              <div className="mb-2">
                <label htmlFor="saved-address-select" className="block font-medium mb-1">Choose Saved Address</label>
                <select
                  id="saved-address-select"
                  className="border rounded px-3 py-2 w-full"
                  value={selectedSavedAddress}
                  onChange={handleSavedAddressSelect}
                  aria-label="Choose Saved Address"
                >
                  <option value="">-- Select from your saved addresses --</option>
                  {savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label ? addr.label + ': ' : ''}{addr.address}, {addr.city}, {addr.state}, {addr.zip_code}
                      {addr.is_default ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="address-input" className="block font-medium mb-1">Service Address</label>
              <textarea id="address-input" className="border rounded px-3 py-2 w-full" rows="3" {...register('address', { required: 'Address is required' })} placeholder="Enter complete address where service is needed" aria-label="Service Address" />
              {errors.address && <span className="text-red-500 text-xs" aria-live="polite">{errors.address.message}</span>}
            </div>
            <div className="mb-4">
              <label htmlFor="notes-input" className="block font-medium mb-1">Additional Notes (Optional)</label>
              <textarea id="notes-input" className="border rounded px-3 py-2 w-full" rows="3" {...register('notes')} placeholder="Any specific requirements or instructions" aria-label="Additional Notes" />
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold mt-2" disabled={isSubmitting} aria-label="Book Service">
              {isSubmitting ? <Spinner size={20} className="inline-block mr-2" /> : null}
              {isSubmitting ? 'Creating Booking...' : 'Book Service'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default BookingForm; 