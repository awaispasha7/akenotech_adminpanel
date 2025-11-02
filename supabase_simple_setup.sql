-- ============================================
-- SIMPLE SETUP - Just Activity Logs
-- ============================================
-- If you only want to track activity, use this simpler version

-- Create Admin Activity Log Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'dashboard_access'
    ip_address TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and insert
CREATE POLICY "Admins can manage activity logs"
    ON public.admin_activity_logs
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_email ON public.admin_activity_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- ============================================
-- Instructions:
-- ============================================
-- 1. Go to Supabase Dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Paste this SQL code
-- 5. Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
-- 
-- Note: For basic authentication, you don't need any tables!
-- Supabase automatically creates auth.users table.
-- These tables are optional for additional features.


