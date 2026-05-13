-- ============================================================
-- Supabase Webhook → GitHub Actions Trigger
-- ============================================================
-- This Edge Function is deployed to Supabase and fires
-- whenever a new row is inserted into the `requests` table.
-- It calls the GitHub Actions repository_dispatch API to
-- start the process-submission.yml workflow automatically.
--
-- DEPLOY STEPS:
--   1. Supabase Dashboard → Edge Functions → New Function
--   2. Name: "notify-github-actions"
--   3. Paste the code below (TypeScript)
--   4. Add secrets: GITHUB_OWNER, GITHUB_REPO, GITHUB_PAT
--   5. Supabase Dashboard → Database → Webhooks → New Webhook
--      Table: requests  |  Events: INSERT
--      HTTP request to: your Edge Function URL
-- ============================================================

-- The TypeScript code for the Edge Function (save as index.ts):
/*
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record  = payload.record;

    if (!record || !record.request_id) {
      return new Response("No record", { status: 200 });
    }

    const owner = Deno.env.get("GITHUB_OWNER") || "";
    const repo  = Deno.env.get("GITHUB_REPO")  || "";
    const pat   = Deno.env.get("GITHUB_PAT")   || "";

    if (!owner || !repo || !pat) {
      console.error("Missing GitHub config");
      return new Response("Config missing", { status: 500 });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          "Accept":        "application/vnd.github+json",
          "Authorization": `Bearer ${pat}`,
          "Content-Type":  "application/json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: JSON.stringify({
          event_type:     "new_submission",
          client_payload: {
            request_id:    record.request_id,
            customer_name: record.customer_name,
            submitted_at:  record.submitted_at
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("GitHub dispatch failed:", err);
      return new Response("Dispatch failed", { status: 500 });
    }

    console.log("GitHub Actions triggered for:", record.request_id);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response("Error", { status: 500 });
  }
});
*/

-- ── Alternative: Direct Postgres Webhook (no Edge Function) ──
-- If you prefer not to use Edge Functions, use Supabase's built-in
-- HTTP webhook. Set the URL to:
--   https://api.github.com/repos/OWNER/REPO/dispatches
-- Headers:
--   Authorization: Bearer YOUR_GITHUB_PAT
--   Accept: application/vnd.github+json
--   Content-Type: application/json
-- Body template (Supabase webhook supports JSON body):
-- {
--   "event_type": "new_submission",
--   "client_payload": {
--     "request_id": "{{ record.request_id }}",
--     "customer_name": "{{ record.customer_name }}"
--   }
-- }
