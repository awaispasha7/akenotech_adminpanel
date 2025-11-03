'use client';

import { useState, useEffect } from 'react';
import ConsultationManager from '../components/ConsultationManager';
import ConsultationLogs from '../components/ConsultationLogs';
import TeamManagement from '../components/TeamManagement';
import { auth, supabase } from '../lib/supabase';

const API_BASE = 'https://web-production-608ab4.up.railway.app';

interface ConsultationStats {
  totalRequests: number;
  pendingRequests: number;
  confirmedRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  recentRequests: number;
}

export default function Home() {
  const [stats, setStats] = useState<ConsultationStats>({
    totalRequests: 0,
    pendingRequests: 0,
    confirmedRequests: 0,
    completedRequests: 0,
    cancelledRequests: 0,
    recentRequests: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [lastConsultationCount, setLastConsultationCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });
  const [loggedInUser, setLoggedInUser] = useState({
    name: '',
    email: ''
  });

  // Callback function to refresh stats when consultation status is updated
  const refreshStats = () => {
    loadStats(true); // true indicates this is an auto-refresh
  };

  const loadStats = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true);
      } else {
        setLoadingStats(true);
      }
      
      // Add cache-busting parameter to ensure fresh data on reload
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for Railway
      
      const response = await fetch(`${API_BASE}/consultation/all?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
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
      
      if (data.status === 'success' && Array.isArray(data.requests)) {
        const consultations = data.requests;
        
        // Calculate stats
        const totalRequests = consultations.length;
        const pendingRequests = consultations.filter((c: any) => c.status === 'pending').length;
        const confirmedRequests = consultations.filter((c: any) => c.status === 'confirmed').length;
        const completedRequests = consultations.filter((c: any) => c.status === 'completed').length;
        const cancelledRequests = consultations.filter((c: any) => c.status === 'cancelled').length;
        
        // Calculate recent requests (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRequests = consultations.filter((c: any) => 
          new Date(c.created_at) >= sevenDaysAgo
        ).length;
        
        setStats({
          totalRequests,
          pendingRequests,
          confirmedRequests,
          completedRequests,
          cancelledRequests,
          recentRequests
        });
        
        // Check if new consultations were added
        if (totalRequests > lastConsultationCount && lastConsultationCount > 0) {
          console.log(`New consultation detected! Count increased from ${lastConsultationCount} to ${totalRequests}`);
        }
        setLastConsultationCount(totalRequests);
        
        setLastUpdated(new Date());
      } else {
        if (!isAutoRefresh) {
          console.error('Failed to load consultation stats:', data);
        }
      }
    } catch (error) {
      // Only log errors for initial load, not auto-refresh to reduce console spam
      if (!isAutoRefresh) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.error('Network error: Unable to connect to the backend server');
          console.error('Please check if the backend is running at:', API_BASE);
        } else if (error instanceof Error && error.name === 'AbortError') {
          console.error('Request timeout: Backend server is not responding (30s timeout)');
          console.error('Please check if the backend is running at:', API_BASE);
        } else if (error instanceof Error) {
          console.error('Error loading stats:', error.message);
        }
      }
      // Don't crash the app, just log the error
      // The stats will remain at their previous values
    } finally {
      setLoadingStats(false);
      setIsAutoRefreshing(false);
    }
  };

  useEffect(() => {
    // Set client-side flag to prevent hydration mismatch
    setIsClient(true);
    
    let initialCheckComplete = false;
    
    // Check authentication on mount - this runs first
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        const session = await auth.getSession();
        
        if (session?.user) {
          const user = session.user;
          const isAdminUser = await auth.isAdmin();
          
          if (isAdminUser) {
            setIsLoggedIn(true);
            setLoggedInUser({
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
              email: user.email || ''
            });
            
            // Load stats only if logged in
            loadStats();
            
            // Set up automatic polling every 10 seconds
            const interval = setInterval(() => {
              loadStats(true);
            }, 10000);
            
            // Store interval ID for cleanup
            (window as any).statsInterval = interval;
          } else {
            // Not an admin, sign out
            await auth.signOut();
            setIsLoggedIn(false);
            setLoggedInUser({ name: '', email: '' });
          }
        } else {
          setIsLoggedIn(false);
          setLoggedInUser({ name: '', email: '' });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
        setLoggedInUser({ name: '', email: '' });
      } finally {
        // Mark initial check as complete before setting isCheckingAuth to false
        initialCheckComplete = true;
        setIsCheckingAuth(false);
      }
    };
    
    // Run initial auth check first
    checkAuth();
    
    // Listen to auth state changes (but don't modify isCheckingAuth here)
    const subscription = auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth State Change]', { event, hasUser: !!session?.user, userEmail: session?.user?.email });
      
      // Skip handling if initial check hasn't completed yet
      // This prevents auth state changes from interfering with the initial check
      if (!initialCheckComplete && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
        return;
      }
      
      if (session?.user) {
        const user = session.user;
        try {
          // Small delay to ensure user data is fully loaded
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Only check admin status on SIGNED_IN event, not on token refresh events
          // This prevents unnecessary checks that might cause issues
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            const isAdminUser = await auth.isAdmin();
            console.log('[Auth State Change] Admin check result:', { isAdminUser, event, userEmail: user.email });
            
            if (isAdminUser) {
              setIsLoggedIn(true);
              setLoggedInUser({
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
                email: user.email || ''
              });
              
              // Only load stats on initial sign in, not on every token refresh
              if (event === 'SIGNED_IN') {
                loadStats();
              }
            } else {
              console.warn('[Auth State Change] Non-admin user detected:', user.email);
              // Only sign out on SIGNED_IN event, not on token refresh
              // This prevents logout during normal token refresh cycles
              if (event === 'SIGNED_IN') {
                await auth.signOut();
                setIsLoggedIn(false);
                setLoggedInUser({ name: '', email: '' });
              } else {
                // If already logged in and token refreshed but admin check fails,
                // don't auto sign out - might be a temporary issue
                console.warn('[Auth State Change] Admin check failed during token refresh, but user is already logged in. Keeping session.');
              }
            }
          }
        } catch (error) {
          console.error('[Auth State Change] Error in handler:', error);
          // Don't sign out on error, just log it
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        console.log('[Auth State Change] User signed out or no session');
        setIsLoggedIn(false);
        setLoggedInUser({ name: '', email: '' });
      }
      // Don't set isCheckingAuth to false here - that's only for initial check
    });
    
    // Set up periodic session validation (every 5 minutes)
    const sessionValidationInterval = setInterval(async () => {
      try {
        const session = await auth.getSession();
        if (session) {
          const isValid = await auth.isSessionValid();
          if (!isValid) {
            console.warn('[Session] Session expired, signing out...');
            await auth.signOut();
            setIsLoggedIn(false);
            setLoggedInUser({ name: '', email: '' });
          }
        }
      } catch (error) {
        console.error('[Session] Error validating session:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      if (subscription?.data?.subscription) {
        subscription.data.subscription.unsubscribe();
      }
      // Clear stats interval if it exists
      if ((window as any).statsInterval) {
        clearInterval((window as any).statsInterval);
      }
      // Clear session validation interval
      clearInterval(sessionValidationInterval);
    };
  }, []);

  const refreshAllData = () => {
    loadStats();
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setFormErrors({ email: '', password: '' });
    
    // Validate fields independently - only show error for fields that actually have issues
    let hasErrors = false;
    
    // Validate email only if it's provided or form is submitted
    if (!loginForm.email) {
      setFormErrors(prev => ({ ...prev, email: 'Email address is required' }));
      hasErrors = true;
    } else if (!validateEmail(loginForm.email)) {
      setFormErrors(prev => ({ ...prev, email: 'Enter a valid email address' }));
      hasErrors = true;
    }
    
    // Only validate password if email is valid and provided
    // This way password won't show error if email is empty
    if (loginForm.email && validateEmail(loginForm.email)) {
      if (!loginForm.password) {
        setFormErrors(prev => ({ ...prev, password: 'Password is required' }));
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      return;
    }

    try {
      setIsLoggingIn(true);
      
      // Sign in with Supabase
      const { user, session } = await auth.signIn(loginForm.email, loginForm.password);
      
      if (user && session) {
        // Check if user is admin
        const isAdminUser = await auth.isAdmin();
        
        if (isAdminUser) {
          setIsLoggedIn(true);
          setLoggedInUser({
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
            email: user.email || ''
          });
          setLoginForm({ email: '', password: '' });
          setFormErrors({ email: '', password: '' });
          
          // Load stats after successful login
          await loadStats();
        } else {
          // Not an admin, sign out immediately
          await auth.signOut();
          setFormErrors(prev => ({ ...prev, password: 'Access denied. Only admin users can login.' }));
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Supabase errors
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid password')) {
        setFormErrors(prev => ({ ...prev, password: 'Invalid password. Please enter correct password.' }));
      } else if (error.message?.includes('Email not confirmed')) {
        setFormErrors(prev => ({ ...prev, email: 'Please verify your email before logging in' }));
      } else if (error.message?.includes('Invalid email')) {
        setFormErrors(prev => ({ ...prev, email: 'Enter a valid email address' }));
      } else {
        setFormErrors(prev => ({ ...prev, password: 'Login failed. Please check your credentials and try again.' }));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      setLoggedInUser({ name: '', email: '' });
      setShowProfileDropdown(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if signOut fails
      setIsLoggedIn(false);
      setLoggedInUser({ name: '', email: '' });
      setShowProfileDropdown(false);
    }
  };


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const deleteAllData = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete all consultations
      const consultationsResponse = await fetch(`${API_BASE}/consultation/all`);
      if (consultationsResponse.ok) {
        const consultationsData = await consultationsResponse.json();
        if (consultationsData.status === 'success' && consultationsData.requests) {
          // Delete each consultation
          for (const consultation of consultationsData.requests) {
            try {
              await fetch(`${API_BASE}/consultation/delete/${consultation.id}`, {
                method: 'DELETE'
              });
            } catch (err) {
              console.log('Could not delete consultation:', consultation.id);
            }
          }
        }
      }

      // Clear logs (if endpoint exists)
      try {
        await fetch(`${API_BASE}/admin/clear-all-logs`, {
          method: 'POST'
        });
      } catch (err) {
        console.log('Logs clearing endpoint not available');
      }

      // Refresh stats after deletion
      await loadStats();
      
      closeDeleteModal();
      
    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#000000'}}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show only login page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#000000'}}>
        {/* Login Page */}
        <div className="max-w-md w-full mx-4">
          <div className="rounded-xl shadow-2xl border p-5" style={{backgroundColor: '#000000', borderColor: '#000000'}}>
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-block bg-white p-4 rounded-2xl shadow-2xl">
                <img 
                  src="/final.png" 
                  alt="Akeno Tech Logo" 
                  className="w-[180px] h-[180px] object-contain mx-auto"
                />
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-2">
              <div>
                <label className="block text-white font-semibold mb-1 text-sm">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => {
                    setLoginForm(prev => ({ ...prev, email: e.target.value }));
                    // Clear error when user starts typing
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    formErrors.email ? 'border-2 border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1a1a1a', 
                    border: formErrors.email ? '2px solid #ef4444' : '2px solid #1a1a1a'
                  }}
                  placeholder="Enter your email"
                />
                {formErrors.email && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.email}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-1 text-sm">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm(prev => ({ ...prev, password: e.target.value }));
                    // Clear error when user starts typing
                    if (formErrors.password) {
                      setFormErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    formErrors.password ? 'border-2 border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: '#1a1a1a', 
                    border: formErrors.password ? '2px solid #ef4444' : '2px solid #1a1a1a'
                  }}
                  placeholder="Enter your password"
                />
                {formErrors.password && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.password}
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 disabled:from-blue-400 disabled:via-blue-500 disabled:to-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center text-base mt-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                {/* Shine effect on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                
                {isLoggingIn ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="relative z-10">Signing In...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Sign In</span>
                    <svg className="w-5 h-5 ml-2 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, show the full dashboard
  return (
    <div className="min-h-screen" style={{backgroundColor: '#000000'}}>
      {/* Top Bar */}
      <div style={{backgroundColor: '#000000', borderColor: '#1a1a1a'}} className="border-b shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18 lg:h-20 w-full">
            <div className="flex items-center space-x-3">
              <img 
                src="/final.png" 
                alt="Admin Panel Logo" 
                className="h-16 w-auto object-contain rounded-lg"
              />
              <h1 className="text-white text-2xl font-bold">Akeno Tech</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn && (
                <div className="relative profile-dropdown-container">
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">Welcome {loggedInUser.name || 'Admin'}</p>
                    </div>
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-auto bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50">
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 text-white hover:bg-gray-700 transition-colors flex items-center text-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">Consultation Management & Team Notifications</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">System Online</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Total Requests */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9,12V11H15V12H9M9,16V15H15V16H9M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{loadingStats ? '...' : stats.totalRequests}</div>
                  <div className="text-blue-100 text-sm font-medium">Total Requests</div>
                </div>
              </div>
              <div className="flex items-center text-blue-100 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                All consultation requests
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{loadingStats ? '...' : stats.pendingRequests}</div>
                  <div className="text-amber-100 text-sm font-medium">Pending</div>
                </div>
              </div>
              <div className="flex items-center text-amber-100 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Awaiting confirmation
              </div>
            </div>
          </div>

          {/* Confirmed Requests */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{loadingStats ? '...' : stats.confirmedRequests}</div>
                  <div className="text-emerald-100 text-sm font-medium">Confirmed</div>
                </div>
              </div>
              <div className="flex items-center text-emerald-100 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scheduled consultations
              </div>
            </div>
          </div>

          {/* Completed Requests */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M16.2,16.2L11,13L7.8,16.2L6.4,14.8L10.6,10.6L11,11L16.2,16.2Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{loadingStats ? '...' : stats.completedRequests}</div>
                  <div className="text-teal-100 text-sm font-medium">Completed</div>
                </div>
              </div>
              <div className="flex items-center text-teal-100 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finished consultations
              </div>
            </div>
          </div>

          {/* Cancelled Requests */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{loadingStats ? '...' : stats.cancelledRequests}</div>
                  <div className="text-red-100 text-sm font-medium">Cancelled</div>
                </div>
              </div>
              <div className="flex items-center text-red-100 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelled appointments
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.9 20.1,3 19,3M19,19H5V8H19V19M7,10H12V15H7V10Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{loadingStats ? '...' : stats.recentRequests}</div>
                  <div className="text-purple-100 text-sm font-medium">Recent (7 days)</div>
                </div>
              </div>
              <div className="flex items-center text-purple-100 text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Last week activity
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-6 mb-12">
          <button 
            onClick={refreshAllData}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh All Data
          </button>
          <button 
            onClick={openDeleteModal}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete All Data
          </button>
        </div>

        {/* Recent Consultation Logs */}
        <ConsultationLogs />

        {/* Team Management */}
        <TeamManagement />

        {/* Consultation Management */}
        <ConsultationManager onStatusUpdate={refreshStats} />
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-red-600 rounded-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="bg-red-900 border-b border-red-600 rounded-t-xl p-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h2 className="text-white font-bold text-lg">Delete All Data</h2>
              </div>
              <button 
                onClick={closeDeleteModal}
                className="text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-red-400 font-semibold text-xl mb-2">Are you sure?</h3>
              <p className="text-gray-300 mb-6">
                This will permanently delete all consultation data. This action cannot be undone.
              </p>
              
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">
                  Type <strong>"DELETE"</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoComplete="off"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAllData}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete All Data'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
