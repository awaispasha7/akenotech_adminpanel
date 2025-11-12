-- ============================================
-- Fix RLS Policies for admin_users table
-- ============================================
-- This allows authenticated users to insert and update their own records
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Service role can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can read admin users" ON public.admin_users;

-- Create policy that allows authenticated users to read
CREATE POLICY "Authenticated users can read admin_users"
    ON public.admin_users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policy that allows authenticated users to insert (for creating their own record)
CREATE POLICY "Authenticated users can insert admin_users"
    ON public.admin_users
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy that allows users to update their own record
CREATE POLICY "Users can update their own admin_users record"
    ON public.admin_users
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Create policy that allows users to update their own record via upsert
-- This is needed for the upsert operation
CREATE POLICY "Users can upsert their own admin_users record"
    ON public.admin_users
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );


