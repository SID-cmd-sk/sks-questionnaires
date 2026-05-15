DROP POLICY IF EXISTS "allow_public_update_requests" ON requests;
CREATE POLICY "allow_public_update_requests"
  ON requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
DROP POLICY IF EXISTS "allow_public_insert_status_logs" ON status_logs;
CREATE POLICY "allow_public_insert_status_logs"
  ON status_logs FOR INSERT TO anon
  WITH CHECK (true);
