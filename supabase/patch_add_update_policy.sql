-- ============================================================
-- SKS Scantech — Supabase Patch: Add missing UPDATE policy
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- and the dashboard "Update Status" button does nothing.
-- ============================================================

-- Allow anon (dashboard) to update request status
CREATE POLICY "allow_public_update_requests"
  ON requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
