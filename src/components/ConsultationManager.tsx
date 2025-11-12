'use client';

import { useState, useEffect } from 'react';
import { auth } from '../lib/supabase';

interface Consultation {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
  status: string;
  created_at: string;
}

const API_BASE = '/api';

interface ConsultationManagerProps {
  onStatusUpdate?: () => void;
}

export default function ConsultationManager({ onStatusUpdate }: ConsultationManagerProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    loadConsultations();
    
    // Set up automatic polling every 10 seconds to show new consultations immediately
    const interval = setInterval(() => {
      loadConsultations(true); // true indicates this is an auto-refresh
    }, 10000); // 10 seconds - shows new consultations quickly
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const loadConsultations = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Add timeout for Railway deployments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Add cache-busting parameter to ensure fresh data on reload
      const headers = await auth.getAuthHeaders();
      const response = await fetch(`${API_BASE}/consultation/all?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          ...headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setConsultations(data.requests || []);
        setError('');
      } else {
        if (!isAutoRefresh) {
          setError('Failed to load consultations');
        }
      }
    } catch (err) {
      // Only show error for initial load, not auto-refresh
      if (!isAutoRefresh) {
        setError('Error loading consultations');
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error loading consultations:', err);
        }
      }
    } finally {
      setLoading(false);
      setIsAutoRefreshing(false);
    }
  };

  const updateConsultationStatus = async (consultationId: string, newStatus: string) => {
    try {
      setUpdating(consultationId);
      const headers = await auth.getAuthHeaders();
      const response = await fetch(`${API_BASE}/consultation/update-status/${consultationId}?status=${newStatus}`, {
        method: 'PUT',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setConsultations(prev => 
          prev.map(consultation => 
            consultation.id === consultationId 
              ? { ...consultation, status: newStatus }
              : consultation
          )
        );
        
        // Notify parent component to refresh stats
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        setError('Failed to update consultation status');
      }
    } catch (err) {
      setError('Error updating consultation status');
      console.error('Error updating status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const deleteConsultation = async (consultationId: string) => {
    if (!confirm('Are you sure you want to delete this consultation?')) {
      return;
    }

    try {
      setUpdating(consultationId);
      const headers = await auth.getAuthHeaders();
      const response = await fetch(`${API_BASE}/consultation/delete/${consultationId}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setConsultations(prev => prev.filter(consultation => consultation.id !== consultationId));
        
        // Notify parent component to refresh stats
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        setError('Failed to delete consultation');
      }
    } catch (err) {
      setError('Error deleting consultation');
      console.error('Error deleting consultation:', err);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-yellow-100';
      case 'confirmed':
        return 'bg-blue-500 text-blue-100';
      case 'completed':
        return 'bg-green-500 text-green-100';
      case 'cancelled':
        return 'bg-red-500 text-red-100';
      default:
        return 'bg-gray-500 text-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div style={{backgroundColor: '#1a2e26'}} className="border border-gray-600 rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-white text-lg">Loading consultations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{backgroundColor: '#0a0a0a'}} className="border border-gray-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Consultation Management</h3>
            <p className="text-gray-400 text-sm">Manage and update consultation statuses</p>
          </div>
        </div>
        <button
          onClick={() => loadConsultations()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-300 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

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

      {consultations.length === 0 ? (
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-6 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold">No consultations found</h4>
              <p className="text-gray-200 text-sm">No consultation requests have been submitted yet.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left text-white font-semibold py-3 px-4">ID</th>
                <th className="text-left text-white font-semibold py-3 px-4">Name</th>
                <th className="text-left text-white font-semibold py-3 px-4">Email</th>
                <th className="text-left text-white font-semibold py-3 px-4">Company</th>
                <th className="text-left text-white font-semibold py-3 px-4">Date & Time</th>
                <th className="text-left text-white font-semibold py-3 px-4">Status</th>
                <th className="text-left text-white font-semibold py-3 px-4">Created</th>
                <th className="text-left text-white font-semibold py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((consultation) => (
                <tr key={consultation.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4 text-gray-300 font-mono text-sm">{consultation.id}</td>
                  <td className="py-3 px-4 text-white font-medium">{consultation.name}</td>
                  <td className="py-3 px-4 text-gray-300">{consultation.email}</td>
                  <td className="py-3 px-4 text-gray-300">{consultation.company || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">
                    {consultation.preferred_date && consultation.preferred_time ? (
                      <div>
                        <div className="font-medium">{consultation.preferred_date}</div>
                        <div className="text-sm text-gray-400">{consultation.preferred_time}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(consultation.status)}`}>
                      {consultation.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{formatDate(consultation.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <select
                        value={consultation.status}
                        onChange={(e) => updateConsultationStatus(consultation.id, e.target.value)}
                        disabled={updating === consultation.id}
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => deleteConsultation(consultation.id)}
                        disabled={updating === consultation.id}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-300 disabled:opacity-50"
                      >
                        {updating === consultation.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
