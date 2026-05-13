# SKS Scantech — Post-Processor Questionnaire System

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?logo=github)](https://pages.github.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Google Drive](https://img.shields.io/badge/Storage-Google%20Drive-4285F4?logo=googledrive)](https://drive.google.com)

---

## What This System Does

Customers fill out the machine questionnaire on the website. Their submission is:

1. **Downloaded locally** as a ZIP (always — no data loss)
2. **Uploaded automatically** to Google Drive (via Apps Script)
3. **Recorded in Supabase** database with full details
4. **Logged in Google Sheets** for tracking
5. **Emailed to the admin** team via EmailJS

The admin can open the dashboard, see all pending requests, and click through to download the ZIP directly from Google Drive.

---

## Quick Links (after deployment)

| Page | URL |
|------|-----|
| Questionnaire | `https://YOUR_USERNAME.github.io/sks-questionnaires/questionnaire_post.html` |
| Admin Dashboard | `https://YOUR_USERNAME.github.io/sks-questionnaires/dashboard/` |
| Client Portal | `https://YOUR_USERNAME.github.io/sks-questionnaires/portal/` |

---

## Files

| File | Description |
|------|-------------|
| `questionnaire_post.html` | Customer-facing form — self-contained, all config inlined |
| `env.js` | Runtime config (Supabase, EmailJS, Apps Script URL) |
| `dashboard/index.html` | Admin request management dashboard |
| `portal/index.html` | Customer request tracking portal |
| `supabase/schema.sql` | Database schema — run once in Supabase SQL Editor |
| `docs/google_apps_script.gs` | Paste into Apps Script — handles Drive upload + Sheets logging |
| `docs/SETUP_GUIDE.md` | Complete setup instructions |
| `.github/workflows/process-submission.yml` | GitHub Actions automation |

---

## Architecture

```
Customer Browser
    │
    ├─ questionnaire_post.html (GitHub Pages)
    │       │
    │       ├─ ZIP ──────────────► Google Drive  (via Apps Script)
    │       ├─ Row ──────────────► Google Sheets (same Apps Script URL)
    │       ├─ JSON ─────────────► Supabase (database)
    │       └─ Email ────────────► EmailJS → Admin inbox
    │
    └─ Supabase INSERT webhook
            │
            └─► GitHub Actions (process-submission.yml)
                    ├─ Downloads ZIP from Google Drive
                    ├─ Validates ZIP structure
                    ├─ Updates status → in_progress
                    └─ Sends admin notification

Admin
    ├─ Dashboard: view all requests, status, Drive links
    └─ Portal:    customers track their own request by ID
```

---

## Services Used (all free)

| Service | Purpose | Free Limit |
|---------|---------|-----------|
| GitHub Pages | Hosting | Unlimited public |
| Google Drive | ZIP file storage | 15 GB |
| Google Sheets + Apps Script | Tracking + upload proxy | Free |
| Supabase | Database | 500 MB, 50K rows |
| EmailJS | Email notifications | 200/month |
| GitHub Actions | Automation | 2,000 min/month |

---

## Setup

See **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** for complete step-by-step instructions.

Estimated setup time: **30–45 minutes** (one-time).

---

*SKS Scantech Engineering Exim Pvt Ltd, New Delhi*
