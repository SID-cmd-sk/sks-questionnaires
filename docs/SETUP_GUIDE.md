# SKS Scantech — Setup Guide
## Complete Step-by-Step Instructions

---

## Overview

```
BEFORE: Customer fills form → downloads ZIP → emails manually → admin imports manually
AFTER:  Customer fills form → ZIP auto-saved to Drive → Supabase updated →
        admin notified by email → admin downloads from Drive link in dashboard
```

**Setup time: ~30–45 minutes (one-time)**  
**All services: Free tier**

---

## Services You'll Set Up

| Service | Purpose | What you need |
|---------|---------|---------------|
| GitHub | Hosting (Pages) + automation (Actions) | GitHub account |
| Google (Drive + Sheets + Apps Script) | File storage + tracking | Google account |
| Supabase | Database | Supabase account |
| EmailJS | Email notifications | EmailJS account |

---

## STEP 1 — GitHub Repository

### 1.1 Create repository
1. Go to https://github.com/new
2. Name: `sks-questionnaires`
3. Visibility: **Public** (required for free GitHub Pages)
4. Click **Create repository**

### 1.2 Upload all project files
Upload the entire folder contents to the repo root. Structure must be:
```
questionnaire_post.html
env.js
.gitignore
dashboard/
  index.html
portal/
  index.html
supabase/
  schema.sql
  webhook_trigger.sql
docs/
  google_apps_script.gs
  SETUP_GUIDE.md
.github/
  workflows/
    process-submission.yml
```

### 1.3 Enable GitHub Pages
1. Repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `(root)`
4. Click **Save**
5. Site will be live at: `https://YOUR_USERNAME.github.io/sks-questionnaires/`

---

## STEP 2 — Google Apps Script (Drive + Sheets)

This is the most important step. One Apps Script handles both file storage and spreadsheet logging.

### 2.1 Create a Google Sheet
1. Go to https://sheets.google.com
2. Create a new spreadsheet
3. Name it: `SKS Submissions Tracker`

### 2.2 Open Apps Script
1. In the spreadsheet: **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Paste the **entire contents** of `docs/google_apps_script.gs`
4. Click **Save** (Ctrl+S or the floppy disk icon)
5. Give the project a name if asked: `SKS Automation`

### 2.3 Deploy as Web App
1. Click **Deploy** (top right) → **New deployment**
2. Click the gear icon ⚙ next to "Type" → select **Web app**
3. Settings:
   - Description: `SKS Questionnaire Handler`
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account → Allow
6. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

> ⚠️ Keep this URL. You'll paste it into `env.js` and `questionnaire_post.html`.

### 2.4 What this script does automatically
- When a form is submitted, it saves the ZIP file to a **"SKS Submissions"** folder in your Google Drive
- It logs a row to the **"SKS Submissions"** sheet in your spreadsheet
- Files are shared "Anyone with link can view" so the admin can download them

---

## STEP 3 — Supabase (Database)

### 3.1 Create project
1. Go to https://supabase.com → **New Project**
2. Name: `sks-scantech`
3. Database password: choose a strong one (save it somewhere)
4. Region: **ap-south-1** (Mumbai — closest to Delhi)
5. Click **Create new project** — wait ~2 minutes

### 3.2 Run the database schema
1. Supabase Dashboard → **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run** ▶
5. You should see: "Success. No rows returned"

### 3.3 Get your credentials
1. Supabase Dashboard → **Project Settings** (gear icon) → **API**
2. Copy and save:
   - **Project URL** — looks like `https://xxxx.supabase.co`
   - **anon public** key — the long `eyJ...` string (safe for browser)
   - **service_role** key — another long string (keep this secret — for GitHub Actions only)

---

## STEP 4 — EmailJS (Email Notifications)

### 4.1 Create account
1. Go to https://www.emailjs.com → Sign up free
2. Free tier: 200 emails/month

### 4.2 Add your email service
1. EmailJS Dashboard → **Email Services** → **Add New Service**
2. Choose **Gmail** (recommended) or your provider
3. Follow OAuth steps → click **Connect Account**
4. Service ID: note it (e.g. `service_sks`) or use the auto-generated one

### 4.3 Create the notification template
1. EmailJS Dashboard → **Email Templates** → **Create New Template**
2. Template content:

   **Subject:** `[NEW REQUEST] {{request_id}} — {{from_name}}`

   **Body:**
   ```
   New post-processor request received.

   Request ID:   {{request_id}}
   Customer:     {{from_name}}
   Email:        {{customer_email}}
   Submitted:    {{submitted_at}}

   Machines:
   {{machine_list}}

   Drive link:   {{zip_url}}
   ```

3. To Email: your admin email address
4. Click **Save**
5. Note the **Template ID** (e.g. `template_abc123`)

### 4.4 Get your Public Key
1. EmailJS Dashboard → **Account** (top right) → **General**
2. Copy the **Public Key**

---

## STEP 5 — Configure env.js

Open `env.js` and fill in your values:

```javascript
window.SKS_CONFIG = {
  CLOUD_ENABLED: true,

  // From Step 3 (Supabase)
  SUPABASE_URL:      "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

  // From Step 4 (EmailJS)
  EMAILJS_SERVICE_ID:  "service_xxxxxxx",
  EMAILJS_TEMPLATE_ID: "template_xxxxxxx",
  EMAILJS_PUBLIC_KEY:  "xxxxxxxxxxxxxxxxxxxx",

  // From Step 2 (Apps Script Web App URL)
  GSHEET_WEBAPP_URL: "https://script.google.com/macros/s/AKfycb.../exec"
};
```

### Also update questionnaire_post.html
The questionnaire has the same config **inlined at the top** (so it works even if `env.js` fails to load). Open `questionnaire_post.html`, find this block near line 11 and update the same values:

```javascript
window.SKS_CONFIG = {
  CLOUD_ENABLED: true,
  SUPABASE_URL:      "https://YOUR_PROJECT.supabase.co",
  ...
```

Commit both files to your GitHub repo.

---

## STEP 6 — GitHub Secrets (for Actions)

Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these one by one:

| Secret Name | Where to get it |
|-------------|-----------------|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role key |
| `EMAILJS_SERVICE_ID` | EmailJS → Email Services |
| `EMAILJS_TEMPLATE_ADMIN_ID` | EmailJS → Email Templates → your template ID |
| `EMAILJS_PUBLIC_KEY` | EmailJS → Account → General → Public Key |

> These are only used by GitHub Actions for the automated processing workflow. They never appear in the browser.

---

## STEP 7 — Supabase Webhook (triggers GitHub Actions automatically)

This makes GitHub Actions fire automatically every time a form is submitted.

1. Supabase Dashboard → **Database** → **Webhooks**
2. **Create a new webhook**
3. Fill in:
   - **Name:** `trigger-github-actions`
   - **Table:** `requests`
   - **Events:** INSERT only ✓
   - **Type:** HTTP Request
   - **URL:** `https://api.github.com/repos/YOUR_USERNAME/sks-questionnaires/dispatches`
   - **Method:** POST
   - **Headers:**
     - `Authorization`: `Bearer YOUR_GITHUB_PAT`
     - `Accept`: `application/vnd.github+json`
     - `Content-Type`: `application/json`
   - **Body:**
     ```json
     {"event_type": "new_submission", "client_payload": {"request_id": "{{ record.request_id }}"}}
     ```
4. Click **Create webhook**

**To get a GitHub PAT:**
1. GitHub → Settings (your profile) → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes: tick `repo`
4. Copy the token (shown once only)

---

## STEP 8 — Test End-to-End

- [ ] Open `https://YOUR_USERNAME.github.io/sks-questionnaires/questionnaire_post.html`
- [ ] Fill in a customer name, add one machine, click **GENERATE & SUBMIT**
- [ ] ZIP downloads locally ✓
- [ ] Upload overlay appears, progress bar runs ✓
- [ ] Success modal shows with a Request ID (e.g. `SKS-1714123456789`) ✓
- [ ] Check Google Drive → "SKS Submissions" folder → ZIP file appears ✓
- [ ] Check Google Sheets → new row with clickable Drive link ✓
- [ ] Check Supabase → Table Editor → `requests` → new row with `status = pending` ✓
- [ ] Check your admin email → notification received ✓
- [ ] Check GitHub → Actions tab → workflow ran successfully ✓
- [ ] Open Dashboard: `https://YOUR_USERNAME.github.io/sks-questionnaires/dashboard/` → request appears ✓
- [ ] Open Portal: `https://YOUR_USERNAME.github.io/sks-questionnaires/portal/` → enter Request ID → status shows ✓

---

## Troubleshooting

### "Cloud upload issue" banner appears
The ZIP still downloads locally — no data is lost. Check:
1. Open browser console (F12) → look for the error message
2. Most common cause: Apps Script URL is wrong or not deployed yet
3. Verify `GSHEET_WEBAPP_URL` in `env.js` and inside `questionnaire_post.html`
4. Make sure the Apps Script is deployed with **Who has access: Anyone** (not "Anyone with Google account")

### Dashboard shows "Check env.js Supabase config"
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `env.js` are correct
- Check Supabase → Authentication → Policies → `requests` table has anon SELECT policy

### Email not received
- Check spam folder
- In EmailJS → Email Logs — does it show a send attempt?
- Verify the template has the correct "To Email" address

### GitHub Actions not triggering
- Check Supabase webhook is enabled (green dot)
- Verify GitHub PAT has `repo` scope and hasn't expired
- Manually trigger: GitHub → Actions → "SKS — Process New Submission" → Run workflow

### File not appearing in Drive
- Check Apps Script → Executions log for errors
- Make sure the deployment is re-done after any code changes (Deploy → **New deployment**, not "Manage deployments → Edit")

---

## Monthly Usage at ~50 Submissions

| Service | Usage | Free Limit |
|---------|-------|-----------|
| Google Drive | ~500 MB/year | 15 GB |
| Supabase | ~600 rows/year | 50,000 rows |
| EmailJS | ~50–100 emails/month | 200/month |
| GitHub Actions | ~50 min/month | 2,000 min/month |

All well within free tiers.

---

*SKS Scantech Engineering Exim Pvt Ltd — Internal Documentation*
