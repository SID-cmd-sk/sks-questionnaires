# SKS Scantech — Post-Processor Questionnaire System
### Cloud-Automated Edition

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?logo=github)](https://pages.github.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary)](https://cloudinary.com)

---

## What This System Does

Customers fill out the machine questionnaire on the website. Their submission is:

1. **Downloaded locally** as a ZIP (unchanged from original — no data loss)
2. **Uploaded automatically** to Cloudinary cloud storage
3. **Recorded in Supabase** database with full details
4. **Logged in Google Sheets** for Excel-style tracking
5. **Emailed to the admin** team with a direct download link
6. **Processed by GitHub Actions** — validated and archived automatically

The admin can then open the desktop processor app, click **Fetch from Cloud**, and process all pending submissions in one click — with the Excel database updated and status marked delivered.

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
| `questionnaire_post.html` | Customer-facing form with cloud upload layer |
| `env.js` | Runtime configuration (Supabase, Cloudinary, EmailJS keys) |
| `dashboard/index.html` | Admin request management dashboard |
| `portal/index.html` | Customer request tracking portal |
| `sks_processor_gui_cloud.py` | Updated admin desktop tool (cloud + local modes) |
| `supabase/schema.sql` | Database schema — run once in Supabase SQL Editor |
| `docs/SETUP_GUIDE.md` | **Complete setup instructions** |
| `docs/google_apps_script.gs` | Deploy to Google Apps Script for Sheets integration |
| `.github/workflows/process-submission.yml` | GitHub Actions automation |
| `.env.example` | All required environment variable names |

---

## Architecture

```
Customer Browser
    │
    ├─ questionnaire_post.html (GitHub Pages)
    │       │
    │       ├─ ZIP ──────────────► Cloudinary (storage)
    │       ├─ JSON ─────────────► Supabase   (database)
    │       ├─ Row ──────────────► Google Sheets
    │       └─ Email ────────────► EmailJS → Admin inbox
    │
    └─ Supabase INSERT webhook
            │
            └─► GitHub Actions (process-submission.yml)
                    │
                    ├─ Downloads ZIP from Cloudinary
                    ├─ Validates ZIP structure
                    ├─ Generates metadata JSON
                    ├─ Updates request → in_progress
                    └─ Sends admin notification

Admin Desktop (sks_processor_gui_cloud.py)
    │
    ├─ LOCAL tab:  import ZIP files manually (original workflow)
    └─ CLOUD tab:  fetch pending → process → mark delivered
```

---

## Setup

See **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** for complete step-by-step instructions.

Estimated setup time: **60–90 minutes** (one-time).  
All services used are on **free tiers**.

---

*SKS Scantech Engineering Exim Pvt Ltd, New Delhi*
