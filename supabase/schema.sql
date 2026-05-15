-- ============================================================
-- SKS Scantech — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

-- ── Customers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT,
  contact       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    TEXT UNIQUE NOT NULL,       -- e.g. SKS-1714123456789
  customer_name TEXT NOT NULL,
  email         TEXT,
  contact       TEXT,
  machine_count INT DEFAULT 0,
  machines_json JSONB,                      -- full machines array
  zip_url       TEXT,                       -- Google Drive share URL (view link)
  json_url      TEXT,
  zip_filename  TEXT,
  status        TEXT DEFAULT 'pending'
                CHECK (status IN ('pending','in_progress','delivered','cancelled')),
  assigned_to   TEXT,
  notes         TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Uploaded files (attachments) ──────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    TEXT REFERENCES requests(request_id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,                       -- zip, pdf, step, jpg, etc.
  file_size_kb  INT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Status logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS status_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    TEXT REFERENCES requests(request_id) ON DELETE CASCADE,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  changed_by    TEXT DEFAULT 'system',
  note          TEXT,
  changed_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Auto-update updated_at on requests ────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-insert status log on status change ───────────────
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_logs(request_id, from_status, to_status)
    VALUES (NEW.request_id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requests_status_log
  AFTER UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;

-- Public INSERT (form submissions from the website)
CREATE POLICY "allow_public_insert_requests"
  ON requests FOR INSERT TO anon WITH CHECK (true);

-- Public READ (client portal + admin dashboard — both use anon key)
CREATE POLICY "allow_public_read_own_request"
  ON requests FOR SELECT TO anon
  USING (true);   -- refine with: USING (request_id = current_setting('app.request_id', true))

-- Public UPDATE — allows dashboard to update status field only
-- (anon key is used by the admin dashboard; restrict to status/notes/assigned_to only)
CREATE POLICY "allow_public_update_requests"
  ON requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Service role can do everything (GitHub Actions / admin)
CREATE POLICY "allow_service_all_requests"
  ON requests FOR ALL TO service_role USING (true);

CREATE POLICY "allow_service_all_files"
  ON uploaded_files FOR ALL TO service_role USING (true);

CREATE POLICY "allow_service_all_logs"
  ON status_logs FOR ALL TO service_role USING (true);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX idx_requests_status     ON requests(status);
CREATE INDEX idx_requests_submitted  ON requests(submitted_at DESC);
CREATE INDEX idx_requests_customer   ON requests(customer_name);
CREATE INDEX idx_files_request_id    ON uploaded_files(request_id);
CREATE INDEX idx_logs_request_id     ON status_logs(request_id);
