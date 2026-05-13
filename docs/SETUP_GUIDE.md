# SKS Scantech — Cloud Automation Setup Guide
## Transforming the Manual Workflow into a Fully Automated System

---

## Overview of What Gets Automated

```
BEFORE (manual):
  Customer fills form → downloads ZIP → emails it manually → admin imports manually → updates Excel

AFTER (automated):
  Customer fills form → ZIP auto-uploads to cloud → Supabase record created →
  GitHub Actions fires → admin notified → admin processes with 1 click → status updated
```

**Estimated setup time: 60–90 minutes (one-time)**  
**All services used: Free tier only**

---

## Services You'll Set Up

| Service | Purpose | Free Tier Limit |
|---------|---------|----------------|
| GitHub Pages | Hosting questionnaire + dashboard | Unlimited public |
| Cloudinary | ZIP/file cloud storage | 25 GB storage, 25 GB bandwidth/month |
| Supabase | Database (requests, logs) | 500 MB DB, 50K rows |
| EmailJS | Email notifications | 200 emails/month |
| Google Sheets | Excel-style tracking | Unlimited |
| GitHub Actions | Automation workflows | 2,000 min/month |

---

## STEP 1 — GitHub Repository Setup

### 1.1 Create repository
1. Go to https://github.com/new
2. Repository name: `sks-questionnaires` (or your choice)
3. Visibility: **Public** (required for free GitHub Pages)
4. Initialize with README: Yes
5. Click **Create repository**

### 1.2 Upload project files
Upload these files to the repository root:
```
sks-questionnaires/
├── questionnaire_post.html     ← modified form (from this package)
├── env.js                      ← runtime config (values filled in Step 5)
├── .gitignore                  ← prevents committing secrets
├── dashboard/
│   └── index.html              ← admin dashboard
├── portal/
│   └── index.html              ← client tracking portal
├── supabase/
│   └── schema.sql
└── .github/
    └── workflows/
        └── process-submission.yml
```

> ⚠️ **NEVER upload `env.js` with real values.** The template version with
> placeholder text is safe to commit. Real values stay in GitHub Secrets only.

### 1.3 Enable GitHub Pages
1. Repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `(root)`
4. Click **Save**
5. Your site will be at: `https://YOUR_USERNAME.github.io/sks-questionnaires/`

---

## STEP 2 — Cloudinary Setup (File Storage)

### 2.1 Create account
1. Go to https://cloudinary.com and sign up (free)
2. Note your **Cloud Name** from the dashboard

### 2.2 Create unsigned upload preset
1. Cloudinary Dashboard → **Settings** → **Upload**
2. Scroll to **Upload Presets** → **Add upload preset**
3. Settings:
   - Preset name: `sks_unsigned_uploads`
   - Signing mode: **Unsigned** ← critical
   - Folder: `sks_submissions`
   - Resource type: `Raw` (handles ZIP, PDF, etc.)
4. Click **Save**

### 2.3 Note your credentials
```
Cloud Name:     your-cloudname
Upload Preset:  sks_unsigned_uploads
```

---

## STEP 3 — Supabase Setup (Database)

### 3.1 Create project
1. Go to https://supabase.com → **New Project**
2. Name: `sks-scantech`
3. Database Password: choose a strong password (save it)
4. Region: **ap-south-1** (Mumbai — closest to Delhi)
5. Wait ~2 minutes for provisioning

### 3.2 Run the schema
1. Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run** (▶)
5. You should see: "Success. No rows returned"

### 3.3 Note your credentials
1. Supabase Dashboard → **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **anon public** key (safe for browser)
   - **service_role** key (secret — server/Actions only)

---

## STEP 4 — EmailJS Setup (Notifications)

### 4.1 Create account
1. Go to https://www.emailjs.com → Sign up (free)
2. Free tier: 200 emails/month

### 4.2 Add email service
1. EmailJS Dashboard → **Email Services** → **Add New Service**
2. Choose your email provider (Gmail recommended)
3. Follow the OAuth steps
4. Service ID: e.g. `service_sks`

### 4.3 Create customer confirmation template
1. **Email Templates** → **Create New Template**
2. Template ID: `template_customer`
3. Subject: `Request Received — {{request_id}}`
4. Body:
```
Dear {{from_name}},

Your post-processor request has been received.

Request ID:  {{request_id}}
Machines:    {{machine_list}}
Submitted:   {{submitted_at}}

Our team will review your requirements and contact you
within 1–2 business days.

— SKS Scantech Engineering Team
```
5. To Email: `{{customer_email}}`

### 4.4 Create admin notification template
1. **Create New Template**
2. Template ID: `template_admin`
3. Subject: `[NEW] Post-processor Request — {{request_id}}`
4. Body:
```
New request received:

Request ID:     {{request_id}}
Customer:       {{from_name}} <{{customer_email}}>
Machines:
{{machine_list}}

ZIP Download:   {{zip_url}}
Dashboard:      {{dashboard_url}}

Submitted:      {{submitted_at}}
```
5. To Email: your admin email

### 4.5 Note credentials
```
Service ID:      service_sks
Template ID 1:   template_customer
Template ID 2:   template_admin
Public Key:      (EmailJS Dashboard → Account → API Keys)
```

---

## STEP 5 — Google Sheets Setup (Tracking)

### 5.1 Create spreadsheet
1. Go to https://sheets.google.com → create new sheet
2. Name it: `SKS Submissions Tracker`

### 5.2 Deploy Apps Script
1. In the spreadsheet: **Extensions** → **Apps Script**
2. Delete the default code
3. Paste the entire contents of `docs/google_apps_script.gs`
4. Click **Save** (Ctrl+S)
5. **Deploy** → **New deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy** → Authorize when prompted
7. Copy the **Web App URL**

---

## STEP 6 — Configure env.js

Edit `env.js` with all the values collected above:

```javascript
window.SKS_CONFIG = {
  CLOUD_ENABLED: true,

  CLOUDINARY_CLOUD_NAME:    "your-cloudname",
  CLOUDINARY_UPLOAD_PRESET: "sks_unsigned_uploads",

  SUPABASE_URL:             "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY:        "eyJhbGciOiJI...",

  EMAILJS_SERVICE_ID:       "service_sks",
  EMAILJS_TEMPLATE_ID:      "template_customer",
  EMAILJS_PUBLIC_KEY:       "your_public_key",

  GSHEET_WEBAPP_URL:        "https://script.google.com/macros/s/XXXXX/exec"
};
```

**Commit this file** — the anon/public keys are safe in browser code.

---

## STEP 7 — GitHub Secrets (for Actions)

Go to: Repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets (one by one, **New repository secret**):

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service_role key from Supabase |
| `EMAILJS_SERVICE_ID` | your EmailJS service ID |
| `EMAILJS_TEMPLATE_ADMIN_ID` | your admin template ID |
| `EMAILJS_PUBLIC_KEY` | your EmailJS public key |

---

## STEP 8 — Supabase Webhook (Auto-trigger GitHub Actions)

### Option A: Supabase Database Webhook (Recommended)
1. Supabase Dashboard → **Database** → **Webhooks**
2. **Create a new webhook**
3. Settings:
   - Name: `trigger-github-actions`
   - Table: `requests`
   - Events: **INSERT** only
   - Type: **HTTP Request**
   - URL: `https://api.github.com/repos/YOUR_USERNAME/sks-questionnaires/dispatches`
   - Method: POST
   - Headers:
     - `Authorization`: `Bearer YOUR_GITHUB_PAT`
     - `Accept`: `application/vnd.github+json`
     - `Content-Type`: `application/json`
   - Body:
     ```json
     {"event_type": "new_submission", "client_payload": {"request_id": "{{ record.request_id }}"}}
     ```
4. Click **Create webhook**

> For GitHub PAT: GitHub → Settings → Developer settings → Personal access tokens (classic)
> Scopes needed: `repo` (workflow dispatch)

### Option B: Supabase Edge Function
See `supabase/webhook_trigger.sql` for full TypeScript code.

---

## STEP 9 — Local Python Processor (Cloud Edition)

### 9.1 Set environment variables
**Windows (Command Prompt):**
```cmd
setx SUPABASE_URL "https://xxxx.supabase.co"
setx SUPABASE_SERVICE_KEY "your_service_role_key"
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("SUPABASE_URL","https://xxxx.supabase.co","User")
[Environment]::SetEnvironmentVariable("SUPABASE_SERVICE_KEY","your_key","User")
```
Restart the terminal after setting.

### 9.2 Use the cloud processor
Run `sks_processor_gui_cloud.py` instead of `sks_processor_gui.py`.

New workflow in the app:
1. Click **☁ FETCH FROM CLOUD** tab
2. Click **↓ FETCH PENDING** to see new submissions
3. Select one or click **▶▶ PROCESS ALL PENDING**
4. App downloads ZIP, processes it, updates Excel, marks delivered in Supabase

The original **📁 LOCAL IMPORT** tab works exactly as before — nothing changed.

---

## STEP 10 — Verify End-to-End

### Test checklist:
- [ ] Open `https://YOUR_USERNAME.github.io/sks-questionnaires/questionnaire_post.html`
- [ ] Fill in customer name, add a machine
- [ ] Click **GENERATE & SUBMIT**
- [ ] Confirm: ZIP downloaded locally (original behavior preserved)
- [ ] Confirm: Upload progress overlay appears
- [ ] Confirm: Success modal shows with Request ID
- [ ] Check Cloudinary dashboard → ZIP appears in `sks_submissions/` folder
- [ ] Check Supabase → `requests` table → new row with `status = pending`
- [ ] Check Google Sheets → new row added
- [ ] Check admin email → notification received
- [ ] Check GitHub Actions → workflow ran (`Actions` tab in repository)
- [ ] Open Dashboard: `https://YOUR_USERNAME.github.io/sks-questionnaires/dashboard/`
- [ ] Confirm request appears with Pending status
- [ ] Open Portal: `https://YOUR_USERNAME.github.io/sks-questionnaires/portal/`
- [ ] Enter Request ID → confirm status displayed

---

## Troubleshooting

### "Cloud upload issue" banner appears
- Check browser console (F12) for specific error
- Verify `env.js` values are correct
- Verify Cloudinary upload preset is set to **Unsigned**
- ZIP still downloads locally — submission not lost

### Dashboard shows "Check env.js Supabase config"
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `env.js`
- Check Supabase → Policies — ensure anon SELECT is allowed

### GitHub Actions not triggering
- Verify Supabase webhook is enabled
- Check GitHub PAT has `repo` scope
- Manually trigger: Actions → process-submission → Run workflow

### Python processor can't fetch from cloud
- Verify environment variables are set (restart terminal after setx)
- Check `SUPABASE_SERVICE_KEY` (service role, not anon)
- Test in terminal: `python -c "import os; print(os.environ.get('SUPABASE_URL'))"`

---

## Folder Structure (Final)

```
sks-questionnaires/                  ← GitHub repository root
│
├── questionnaire_post.html          ← Customer-facing form (modified)
├── env.js                           ← Runtime config (commit with real values)
├── .gitignore
├── .env.example                     ← Reference for all variables
│
├── dashboard/
│   └── index.html                   ← Admin dashboard
│
├── portal/
│   └── index.html                   ← Customer tracking portal
│
├── supabase/
│   ├── schema.sql                   ← Database schema (run once)
│   └── webhook_trigger.sql          ← GitHub Actions trigger setup
│
├── docs/
│   ├── google_apps_script.gs        ← Paste into Apps Script editor
│   └── SETUP_GUIDE.md               ← This file
│
├── .github/
│   └── workflows/
│       └── process-submission.yml   ← GitHub Actions automation
│
└── sks_processor_gui_cloud.py       ← Updated Python admin tool
                                        (original .py also kept)
```

---

## Monthly Usage Estimates (Free Tier)

Assuming ~50 submissions/month:

| Service | Usage | Free Limit | Status |
|---------|-------|-----------|--------|
| Cloudinary | ~500 MB storage | 25 GB | ✅ Well within |
| Supabase | ~5K rows/year | 50K rows | ✅ Well within |
| EmailJS | ~100 emails/month | 200/month | ✅ Fine |
| GitHub Actions | ~100 min/month | 2,000 min | ✅ Fine |
| GitHub Pages | Static hosting | Unlimited | ✅ Fine |

> For higher volume (200+ submissions/month), EmailJS may need upgrading to
> the $9/month plan. All other services remain free.

---

*SKS Scantech Engineering Exim Pvt Ltd — Internal Documentation*
