DROP POLICY IF EXISTS "allow_public_insert_requests"  ON requests;
DROP POLICY IF EXISTS "allow_public_read_own_request" ON requests;
DROP POLICY IF EXISTS "allow_public_update_requests"  ON requests;
DROP POLICY IF EXISTS "allow_service_all_requests"    ON requests;
CREATE POLICY "allow_public_insert_requests"
  ON requests FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "allow_public_read_own_request"
  ON requests FOR SELECT TO anon
  USING (true);
CREATE POLICY "allow_public_update_requests"
  ON requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
CREATE POLICY "allow_service_all_requests"
  ON requests FOR ALL TO service_role
  USING (true);
DROP POLICY IF EXISTS "allow_public_insert_status_logs" ON status_logs;
DROP POLICY IF EXISTS "allow_public_read_status_logs"   ON status_logs;
DROP POLICY IF EXISTS "allow_service_all_logs"          ON status_logs;
CREATE POLICY "allow_public_insert_status_logs"
  ON status_logs FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "allow_public_read_status_logs"
  ON status_logs FOR SELECT TO anon
  USING (true);
CREATE POLICY "allow_service_all_logs"
  ON status_logs FOR ALL TO service_role
  USING (true);
DROP POLICY IF EXISTS "allow_public_insert_files" ON uploaded_files;
DROP POLICY IF EXISTS "allow_public_read_files"   ON uploaded_files;
DROP POLICY IF EXISTS "allow_service_all_files"   ON uploaded_files;
CREATE POLICY "allow_public_insert_files"
  ON uploaded_files FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "allow_public_read_files"
  ON uploaded_files FOR SELECT TO anon
  USING (true);
CREATE POLICY "allow_service_all_files"
  ON uploaded_files FOR ALL TO service_role
  USING (true);
DROP POLICY IF EXISTS "allow_service_all_customers" ON customers;
CREATE POLICY "allow_service_all_customers"
  ON customers FOR ALL TO service_role
  USING (true);
