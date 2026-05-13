/**
 * SKS Cloud Config — env.js
 * ─────────────────────────────────────────────────────────
 * Storage:  Google Drive (via Apps Script — no Cloudinary needed)
 * Database: Supabase
 * Email:    EmailJS
 * Sheets:   Google Apps Script (same URL as Drive upload)
 * ─────────────────────────────────────────────────────────
 */
window.SKS_CONFIG = {

  // Set to false to disable cloud and work fully offline
  CLOUD_ENABLED: true,

  // ── Supabase (anon/public key — safe in browser) ─────────
  SUPABASE_URL:      "https://nlewnmnqytetpcrwfvlm.supabase.co/rest/v1/",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZXdubW5xeXRldHBjcndmdmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzQzMDksImV4cCI6MjA5NDIxMDMwOX0.lYxVmr_6a-7BCq68UvOaiqsAs1xqGpflJZb1fgtDpJo",

  // ── EmailJS (public key — safe in browser) ───────────────
  EMAILJS_SERVICE_ID:  "service_r19w6gi",
  EMAILJS_TEMPLATE_ID: "template_hrzjr9r",
  EMAILJS_PUBLIC_KEY:  "hSrYf7KXECv_l0BEg",

  // ── Google Apps Script Web App URL ────────────────────────
  // This ONE URL handles:
  //   • ZIP upload to Google Drive   (action: 'upload_zip')
  //   • Row logging to Google Sheets (action: 'append_row' / default)
  GSHEET_WEBAPP_URL: "hhttps://script.google.com/macros/s/AKfycbxd9v57EzjN0cUKc3QPyK2zM_Bl18XhNk2jhHiDoJy-aU-oEIbzAFYVXXJFG1B4Xd1YpA/exec"

};
