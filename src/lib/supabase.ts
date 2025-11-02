import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const supabaseUrl = 'https://qxusgissnsnqobpozhuq.supabase.co'; // Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dXNnaXNzbnNucW9icG96aHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODc2NDgsImV4cCI6MjA3NzQ2MzY0OH0.jLyrt8_MYJXZzDb3oF20fbGqvulXaDW-QbtO9j9UK4g'; // Replace with your Supabase anon/public key

// Validation check - credentials are configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials are missing!');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
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

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Check if user is admin (you can customize this logic)
  isAdmin: async () => {
    try {
      const user = await auth.getUser();
      if (!user || !user.email) {
        console.log('[Admin Check] No user or email found');
        return false;
      }
      
      // Check if user email is in admin list or has admin role
      // Add your admin email addresses here
      const adminEmails = [
        'admin@softtechniques.com',
        'ask@softtechniques.com', // Admin user email
        'asad.aslam@softtechniques.com', // Admin user email
        'awaispasha@softtechniques.com', // Admin user email
        'uahmad@softtechniques.com' // Admin user email
      ];
      
      // Normalize emails for case-insensitive comparison (trim and lowercase)
      const userEmail = (user.email || '').trim().toLowerCase();
      const normalizedAdminEmails = adminEmails.map(email => email.trim().toLowerCase());
      
      const isAdmin = normalizedAdminEmails.includes(userEmail);
      
      // Detailed debug logging
      console.log('[Admin Check]', {
        rawEmail: user.email,
        normalizedUserEmail: userEmail,
        adminEmailsList: normalizedAdminEmails,
        isAdmin: isAdmin,
        userExists: !!user,
        emailExists: !!user.email
      });
      
      return isAdmin;
    } catch (error) {
      console.error('[Admin Check] Error checking admin status:', error);
      return false;
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return { data: { subscription } };
  }
};

