'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '../lib/supabase';

interface ConsultationLog {
  timestamp: string;
  action: string;
  consultation_id: string;
  user_name: string;
  user_email: string;
  status: string;
  company: string;
}

const API_BASE = 'https://web-production-ae7a.up.railway.app';

interface ConsultationLogsProps {
  onLogsCleared?: () => void;
  refreshTrigger?: number;
}

export default function ConsultationLogs({ onLogsCleared, refreshTrigger }: ConsultationLogsProps) {
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('24');
  const [statusFilter, setStatusFilter] = useState('');
  const [hideDeleted, setHideDeleted] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const loadLogs = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      // Always use the recent logs endpoint with time range
      let url = `${API_BASE}/admin/logs/recent?hours=${timeRange}`;
      
      // Add cache-busting parameter to ensure fresh data on reload
      url += `&t=${Date.now()}`;
      
      // Add timeout for Railway deployments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const headers = await auth.getAuthHeaders();
      const response = await fetch(url, {
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
        let filteredLogs = data.logs || [];
        
        // Filter out deleted actions if hideDeleted is enabled
        if (hideDeleted) {
          filteredLogs = filteredLogs.filter((log: ConsultationLog) => 
            log.action.toLowerCase() !== 'deleted' && log.status.toLowerCase() !== 'deleted'
          );
        }
        
        // Apply status filter on the frontend if selected
        if (statusFilter) {
          filteredLogs = filteredLogs.filter((log: ConsultationLog) => 
            log.status.toLowerCase() === statusFilter.toLowerCase()
          );
        }
        
        setLogs(filteredLogs);
        setError('');
        
        // If logs are empty after filtering, notify parent that logs were cleared
        if (filteredLogs.length === 0 && data.logs && data.logs.length === 0 && !isAutoRefresh) {
          if (onLogsCleared) {
            onLogsCleared();
          }
        }
      } else {
        if (!isAutoRefresh) {
          setError('Failed to load consultation logs');
        }
      }
    } catch (err) {
      // Only show error for initial load, not auto-refresh
      if (!isAutoRefresh) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Error loading consultation logs');
          console.error('Error loading logs:', err);
        }
      }
    } finally {
      setLoading(false);
      setIsAutoRefreshing(false);
    }
  }, [timeRange, statusFilter, hideDeleted]);

  useEffect(() => {
    // Initial load
    loadLogs();
    
    // Set up automatic polling every 10 seconds to show new consultations immediately
    const interval = setInterval(() => {
      loadLogs(true); // true indicates this is an auto-refresh
    }, 10000); // 10 seconds - shows new consultations quickly
    
    // Cleanup interval on component unmount or when filters change
    return () => clearInterval(interval);
  }, [loadLogs]);
  
  // Refresh logs when refreshTrigger changes (e.g., after delete all)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadLogs(false);
    }
  }, [refreshTrigger, loadLogs]);

  // Stable reference for manual refresh button
  const handleManualRefresh = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    loadLogs(false); // false = manual refresh, will show loading state
  }, [loadLogs]);

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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{backgroundColor: '#0a0a0a'}} className="border border-gray-600 rounded-xl p-8 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Recent Consultation Logs</h3>
            <p className="text-gray-400 text-sm">Latest consultation activities and status updates</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400' : error ? 'bg-red-400' : 'bg-green-400'}`}></div>
          <span className={`text-xs font-medium ${loading ? 'text-yellow-400' : error ? 'text-red-400' : 'text-green-400'}`}>
            {loading ? 'Loading' : error ? 'Error' : 'Online'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-sm hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onFocus={(e) => e.stopPropagation()}
        >
          <option value="24">Last 24 hours</option>
          <option value="168">Last 7 days</option>
          <option value="720">Last 30 days</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg text-sm hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onFocus={(e) => e.stopPropagation()}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label className="flex items-center space-x-2 bg-gray-700 border border-gray-600 px-4 py-3 rounded-lg text-sm hover:bg-gray-600 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={hideDeleted}
            onChange={(e) => setHideDeleted(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-white">Hide Deleted</span>
        </label>
        <button 
          onClick={handleManualRefresh}
          disabled={loading}
          type="button"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg text-sm transition-all duration-300 flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
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
              Refresh
            </>
          )}
        </button>
      </div>
      
      {loading ? (
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-center">
            <svg className="w-6 h-6 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Loading consultation logs...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-semibold">Error loading logs</h4>
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-6 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold">No logs found</h4>
              <p className="text-gray-200 text-sm">No consultation logs available for the selected time range.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left text-white font-semibold py-3 px-4">Timestamp</th>
                <th className="text-left text-white font-semibold py-3 px-4">Action</th>
                <th className="text-left text-white font-semibold py-3 px-4">Consultation ID</th>
                <th className="text-left text-white font-semibold py-3 px-4">Name</th>
                <th className="text-left text-white font-semibold py-3 px-4">Email</th>
                <th className="text-left text-white font-semibold py-3 px-4">Status</th>
                <th className="text-left text-white font-semibold py-3 px-4">Company</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4 text-gray-300 text-sm">{formatTimestamp(log.timestamp)}</td>
                  <td className="py-3 px-4 text-white font-medium">{log.action}</td>
                  <td className="py-3 px-4 text-gray-300 font-mono text-sm">{log.consultation_id}</td>
                  <td className="py-3 px-4 text-white">{log.user_name}</td>
                  <td className="py-3 px-4 text-gray-300">{log.user_email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{log.company || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
