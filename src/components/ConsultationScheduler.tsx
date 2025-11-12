'use client';

import { useState, useEffect } from 'react';
import { auth } from '../lib/supabase';

interface ConsultationFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
}

interface AvailableSlot {
  date: string;
  times: string[];
}

const API_BASE = '/api';

export default function ConsultationScheduler() {
  const [formData, setFormData] = useState<ConsultationFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    preferred_date: '',
    preferred_time: '',
    message: ''
  });

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load available slots on component mount
  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const headers = await auth.getAuthHeaders();
      const response = await fetch(`${API_BASE}/consultation/available-slots`, {
        headers
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.available_slots || []);
      } else {
        setError('Failed to load available time slots');
      }
    } catch (err) {
      setError('Error loading available slots');
      console.error('Error loading slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const headers = await auth.getAuthHeaders();
      const response = await fetch(`${API_BASE}/consultation/schedule`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          preferred_date: '',
          preferred_time: '',
          message: ''
        });
        // Refresh available slots
        loadAvailableSlots();
      } else {
        setError(data.message || 'Failed to schedule consultation');
      }
    } catch (err) {
      setError('Error scheduling consultation');
      console.error('Error scheduling:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableTimesForDate = (date: string) => {
    const slot = availableSlots.find(s => s.date === date);
    return slot ? slot.times : [];
  };

  return (
    <div style={{backgroundColor: '#1a2e26'}} className="border border-gray-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Schedule New Consultation</h3>
          <p className="text-gray-400 text-sm">Book a consultation appointment for clients</p>
        </div>
      </div>

      {success && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold">Consultation Scheduled Successfully!</h4>
              <p className="text-green-100 text-sm">The consultation has been booked and notifications sent to the team.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-xl mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-semibold">Error</h4>
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Client Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter client name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Preferred Date
            </label>
            <select
              name="preferred_date"
              value={formData.preferred_date}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a date</option>
              {availableSlots.map((slot) => (
                <option key={slot.date} value={slot.date}>
                  {new Date(slot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Preferred Time
            </label>
            <select
              name="preferred_time"
              value={formData.preferred_time}
              onChange={handleInputChange}
              disabled={!formData.preferred_date}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Select a time</option>
              {formData.preferred_date && getAvailableTimesForDate(formData.preferred_date).map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Project Description / Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Describe the project or any additional information..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={loadAvailableSlots}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-300 flex items-center"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Slots
              </>
            )}
          </button>
          
          <button
            type="submit"
            disabled={submitting || !formData.name || !formData.email}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Scheduling...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Consultation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

