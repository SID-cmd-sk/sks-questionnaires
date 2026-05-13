# Migration Notes
## SKS Questionnaire System — v1.0 (Manual) → v2.0 (Cloud Automated)

---

## What Was Changed

### questionnaire_post.html

**Changes made:**
1. Added `<script src="env.js">` tag after the existing JSZip CDN import
2. Appended ~250 lines of cloud automation JS at the end of `<script>` block
3. Patched the two `triggerDownload(zipBlob, zipName)` calls to also call `cloudDispatch()`

**Lines modified:** 2 small patches + 1 script tag  
**Original functionality:** 100% preserved  
**Risk:** Zero — cloud runs after the local download; any cloud failure shows a non-blocking banner

**Before (finalize function):**
```javascript
.then(zipBlob => {
    triggerDownload(zipBlob, zipName);
    resetBtn(btn);
});
```

**After:**
```javascript
.then(async zipBlob => {
    triggerDownload(zipBlob, zipName);   // ← unchanged
    resetBtn(btn);
    await cloudDispatch(zipBlob, zipName, jsonData);  // ← new
});
```

### sks_processor_gui.py

**NOT modified.** Original file left completely intact.

A new file `sks_processor_gui_cloud.py` was created that:
- Contains the entire original processing logic (copy-paste, no changes)
- Adds a second "☁ FETCH FROM CLOUD" tab to the GUI
- The original "📁 LOCAL IMPORT" tab is identical to the original

**Which to use:**
- `sks_processor_gui.py` — original, if you don't want cloud features
- `sks_processor_gui_cloud.py` — cloud edition, fully backward-compatible

---

## What Was NOT Changed

| Item | Status |
|------|--------|
| ZIP structure / format | ✅ Unchanged |
| data.json schema | ✅ Unchanged |
| PDF generation (jsPDF) | ✅ Unchanged |
| Excel processing logic | ✅ Unchanged |
| Folder structure (processed/, error/) | ✅ Unchanged |
| Log file format | ✅ Unchanged |
| UI style / theme / branding | ✅ Unchanged |
| Form fields / validation | ✅ Unchanged |
| Machine entry structure | ✅ Unchanged |

---

## What Was Added (New Files Only)

| New File | Purpose |
|----------|---------|
| `env.js` | Runtime config — inject service keys at deploy time |
| `dashboard/index.html` | Admin web dashboard (Supabase-powered) |
| `portal/index.html` | Customer request tracking portal |
| `sks_processor_gui_cloud.py` | Cloud-enabled desktop processor |
| `supabase/schema.sql` | Database schema (run once) |
| `supabase/webhook_trigger.sql` | GitHub Actions trigger setup guide |
| `.github/workflows/process-submission.yml` | GitHub Actions workflow |
| `docs/google_apps_script.gs` | Google Sheets automation script |
| `docs/SETUP_GUIDE.md` | Setup instructions |
| `.env.example` | Environment variable reference |
| `.gitignore` | Prevents committing secrets |
| `README.md` | Repository documentation |

---

## Rollback Plan

If any issue arises with the cloud layer:

**Option A — Instant disable:**  
In `env.js`, set `CLOUD_ENABLED: false`.  
The questionnaire reverts to local-only mode immediately.

**Option B — Full rollback:**  
Replace `questionnaire_post.html` with the original file.  
Continue using `sks_processor_gui.py` as before.  
No data is lost — all ZIPs still download locally.

**The cloud layer is additive and non-blocking. Original workflow always runs first.**

---

## Data Flow Comparison

### Before
```
Customer fills form
    ↓
ZIP generated + downloaded to customer PC
    ↓
Customer emails ZIP to SKS manually
    ↓
Admin saves ZIP to /incoming/ folder
    ↓
Admin opens sks_processor_gui.py
    ↓
Admin selects ZIP → processes → Excel updated
```

### After
```
Customer fills form
    ↓
ZIP generated + downloaded to customer PC  ← SAME
    ↓
ZIP auto-uploaded to Cloudinary             ← NEW
    ↓
Row inserted in Supabase                   ← NEW
    ↓
Row added to Google Sheets                 ← NEW
    ↓
Admin email notification sent              ← NEW
    ↓
GitHub Actions fires automatically         ← NEW
    ↓
Admin opens sks_processor_gui_cloud.py
    ↓
Clicks "Fetch from Cloud" → one-click process all pending  ← EASIER
    ↓
Excel updated + Supabase marked delivered  ← SAME + NEW
```

---

## Security Notes

### Keys that are safe in browser code (env.js)
- `SUPABASE_ANON_KEY` — read-only public key, RLS enforced
- `CLOUDINARY_UPLOAD_PRESET` — unsigned upload, no delete/manage access
- `EMAILJS_PUBLIC_KEY` — rate-limited, template-controlled
- `GSHEET_WEBAPP_URL` — Apps Script endpoint, append-only

### Keys that must NEVER be in browser code
- `SUPABASE_SERVICE_KEY` — full database access → GitHub Secrets only
- GitHub Personal Access Token → GitHub Secrets only

### Cloudinary security
- Unsigned upload preset only allows **uploading** new files
- Cannot list, delete, or transform files without API secret
- Files stored in dedicated `sks_submissions/` folder
- File type restrictions can be added in preset settings

### Supabase Row Level Security
- Schema enables RLS on all tables
- Anon key can INSERT (submit forms) and SELECT (track status)
- Only service_role key (server-side) can UPDATE/DELETE
- Admin dashboard uses anon key — status updates use PATCH via anon
  → For production, restrict PATCH to authenticated users:
    ```sql
    -- Replace the public select policy with auth-gated update
    CREATE POLICY "admin_update" ON requests
      FOR UPDATE TO authenticated USING (true);
    ```
