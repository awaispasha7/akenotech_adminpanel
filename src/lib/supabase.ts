import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const supabaseUrl = 'https://cgwikuodyiiwsjlgyuea.supabase.co'; // Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnd2lrdW9keWlpd3NqbGd5dWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjk1NjksImV4cCI6MjA3NzcwNTU2OX0.mm83O7jhzDzKkjn9zvXPhhRCz5p-ZGwXMgyVwOyn8m0'; // Replace with your Supabase anon/public key

// Validation check - credentials are configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials are missing!');
}

// Create Supabase client with enhanced session management
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'akenotech_auth_token',
    flowType: 'pkce'
  }
});

// Auth helper functions
export const auth = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session with validation
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Session] Error getting session:', error);
        throw error;
      }
      
      // Validate session is still valid
      if (session) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.warn('[Session] Session expired, attempting refresh...');
          // Try to refresh the session
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshedSession) {
            console.error('[Session] Failed to refresh session:', refreshError);
            return null;
          }
          return refreshedSession;
        }
      }
      
      return session;
    } catch (error) {
      console.error('[Session] Error in getSession:', error);
      return null;
    }
  },

  // Get current user
  getUser: async () => {
    try {
      // First check if we have a session
      const session = await auth.getSession();
      if (!session) {
        return null;
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // If it's a session missing error, return null instead of throwing
        if (error.message?.includes('session') || error.message?.includes('Session')) {
          return null;
        }
        throw error;
      }
      return user;
    } catch (error: any) {
      // Handle AuthSessionMissingError gracefully
      if (error?.message?.includes('session') || error?.message?.includes('Session')) {
        return null;
      }
      throw error;
    }
  },

  // Check if user is admin (you can customize this logic)
  isAdmin: async () => {
    try {
      // First check if we have a session
      const session = await auth.getSession();
      if (!session || !session.user) {
        // No session is expected when not logged in, don't log as error
        return false;
      }
      
      // Use the user from the session instead of calling getUser() again
      const user = session.user;
      if (!user || !user.email) {
        return false;
      }
      
      // Check if user email is in admin list or has admin role
      // Add your admin email addresses here
      const adminEmails = [
        'ask@akenotech.com', // Admin user email
        'uahmad@akenotech.com', // Admin user email
        'asad.aslam@akenotech.com', // Admin user email
        'awaispasha@akenotech.com' // Admin user email
      ];
      
      // Normalize emails for case-insensitive comparison (trim and lowercase)
      const userEmail = (user.email || '').trim().toLowerCase();
      const normalizedAdminEmails = adminEmails.map(email => email.trim().toLowerCase());
      
      const isAdmin = normalizedAdminEmails.includes(userEmail);
      
      // Detailed debug logging (only when we have a user)
      console.log('[Admin Check]', {
        rawEmail: user.email,
        normalizedUserEmail: userEmail,
        adminEmailsList: normalizedAdminEmails,
        isAdmin: isAdmin,
        userExists: !!user,
        emailExists: !!user.email
      });
      
      return isAdmin;
    } catch (error: any) {
      // Only log as error if it's not a session-related error
      if (error?.message && !error.message.includes('session') && !error.message.includes('Session')) {
        console.error('[Admin Check] Error checking admin status:', error);
      }
      return false;
    }
  },

  // Get access token from current session with auto-refresh
  getAccessToken: async () => {
    try {
      const session = await auth.getSession();
      if (!session) {
        console.warn('[Session] No active session found');
        return null;
      }
      
      // Check if token is about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at - now < 300) {
        console.log('[Session] Token expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        if (error || !refreshedSession) {
          console.error('[Session] Failed to refresh token:', error);
          return session.access_token; // Return existing token as fallback
        }
        return refreshedSession.access_token;
      }
      
      return session.access_token;
    } catch (error) {
      console.error('[Session] Error getting access token:', error);
      return null;
    }
  },
  
  // Check if session is valid
  isSessionValid: async () => {
    try {
      const session = await auth.getSession();
      if (!session) return false;
      
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[Session] Error checking session validity:', error);
      return false;
    }
  },
  
  // Refresh session manually
  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('[Session] Error refreshing session:', error);
        throw error;
      }
      return session;
    } catch (error) {
      console.error('[Session] Failed to refresh session:', error);
      throw error;
    }
  },

  // Get auth headers for API requests
  getAuthHeaders: async () => {
    const token = await auth.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return { data: { subscription } };
  }
};

