-- ============================================================
-- SKS Scantech — Supabase Patch
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Fixes dashboard "Update Status" button
-- ============================================================

-- 1. Allow anon to UPDATE requests (dashboard status changes)
CREATE POLICY "allow_public_update_requests"
  ON requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- 2. Allow anon to INSERT into status_logs
--    (the trg_requests_status_log trigger fires automatically on
--     every status change and inserts a row into status_logs)
CREATE POLICY "allow_public_insert_status_logs"
  ON status_logs FOR INSERT TO anon
  WITH CHECK (true);
