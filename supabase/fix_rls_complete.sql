-- ============================================================
-- SKS Scantech — Complete RLS Policy Fix
-- Run this in Supabase Dashboard → SQL Editor
--
-- Safe to run even if schema.sql was already applied.
-- Drops and recreates all policies so there are no conflicts
-- or duplicate-policy errors.
-- ============================================================


-- ── REQUESTS table ─────────────────────────────────────────

-- Drop all existing policies first (avoids "already exists" errors)
DROP POLICY IF EXISTS "allow_public_insert_requests"  ON requests;
DROP POLICY IF EXISTS "allow_public_read_own_request" ON requests;
DROP POLICY IF EXISTS "allow_public_update_requests"  ON requests;
DROP POLICY IF EXISTS "allow_service_all_requests"    ON requests;

-- Anon can INSERT (form submissions)
CREATE POLICY "allow_public_insert_requests"
  ON requests FOR INSERT TO anon
  WITH CHECK (true);

-- Anon can SELECT (client portal + dashboard both use anon key)
CREATE POLICY "allow_public_read_own_request"
  ON requests FOR SELECT TO anon
  USING (true);

-- Anon can UPDATE (dashboard status changes)
CREATE POLICY "allow_public_update_requests"
  ON requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Service role has full access (GitHub Actions / server-side)
CREATE POLICY "allow_service_all_requests"
  ON requests FOR ALL TO service_role
  USING (true);


-- ── STATUS_LOGS table ──────────────────────────────────────
-- The trigger trg_requests_status_log fires on every UPDATE
-- to requests.status and does INSERT INTO status_logs.
-- Without an anon INSERT policy here, the dashboard PATCH
-- that changes status will fail even if the requests UPDATE
-- policy is correct.

DROP POLICY IF EXISTS "allow_public_insert_status_logs" ON status_logs;
DROP POLICY IF EXISTS "allow_public_read_status_logs"   ON status_logs;
DROP POLICY IF EXISTS "allow_service_all_logs"          ON status_logs;

-- Anon can INSERT (triggered automatically by status changes)
CREATE POLICY "allow_public_insert_status_logs"
  ON status_logs FOR INSERT TO anon
  WITH CHECK (true);

-- Anon can SELECT (portal timeline view)
CREATE POLICY "allow_public_read_status_logs"
  ON status_logs FOR SELECT TO anon
  USING (true);

-- Service role full access
CREATE POLICY "allow_service_all_logs"
  ON status_logs FOR ALL TO service_role
  USING (true);


-- ── UPLOADED_FILES table ───────────────────────────────────

DROP POLICY IF EXISTS "allow_public_insert_files" ON uploaded_files;
DROP POLICY IF EXISTS "allow_public_read_files"   ON uploaded_files;
DROP POLICY IF EXISTS "allow_service_all_files"   ON uploaded_files;

-- Anon can INSERT attachments
CREATE POLICY "allow_public_insert_files"
  ON uploaded_files FOR INSERT TO anon
  WITH CHECK (true);

-- Anon can SELECT (portal attachments view)
CREATE POLICY "allow_public_read_files"
  ON uploaded_files FOR SELECT TO anon
  USING (true);

-- Service role full access
CREATE POLICY "allow_service_all_files"
  ON uploaded_files FOR ALL TO service_role
  USING (true);


-- ── CUSTOMERS table ────────────────────────────────────────

DROP POLICY IF EXISTS "allow_service_all_customers" ON customers;

CREATE POLICY "allow_service_all_customers"
  ON customers FOR ALL TO service_role
  USING (true);


-- ── Verify (optional — run separately to confirm) ──────────
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
