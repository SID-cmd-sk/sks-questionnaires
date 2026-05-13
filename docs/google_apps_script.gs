/**
 * SKS Scantech — Google Sheets Automation
 * ==========================================
 * Deploy this as a Google Apps Script Web App:
 *   Extensions → Apps Script → paste this → Deploy → Web App
 *   Execute as: Me  |  Access: Anyone
 *
 * Copy the Web App URL into env.js → GSHEET_WEBAPP_URL
 */

// ── Config ────────────────────────────────────────────────
const SHEET_NAME    = "SKS Submissions";
const SPREADSHEET_ID = "";  // Leave empty to use the bound spreadsheet,
                             // OR paste your Spreadsheet ID here

// ── Column headers (must match order in appendRow) ────────
const HEADERS = [
  "Request ID", "Customer Name", "Company",
  "Machine(s)", "Controller(s)", "Date Submitted",
  "Status", "ZIP URL", "Email", "Contact", "Machine Count"
];

// ── POST handler (called by questionnaire form) ───────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    appendRow(data);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET handler (health check) ────────────────────────────
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", sheet: SHEET_NAME }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Append a row ──────────────────────────────────────────
function appendRow(data) {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME);

  // Create sheet + headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const hRow = sheet.getRange(1, 1, 1, HEADERS.length);
    hRow.setValues([HEADERS]);
    hRow.setFontWeight("bold");
    hRow.setBackground("#CC0000");
    hRow.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);   // Request ID
    sheet.setColumnWidth(2, 180);   // Customer
    sheet.setColumnWidth(4, 220);   // Machines
    sheet.setColumnWidth(8, 280);   // ZIP URL
  }

  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

  sheet.appendRow([
    data.request_id    || "",
    data.customer_name || "",
    data.company       || "",
    data.machine       || "",
    data.controller    || "",
    data.date          || now,
    data.status        || "Pending",
    data.zip_url       || "",
    data.email         || "",
    data.contact       || "",
    data.machine_count || ""
  ]);

  // Auto-colour the status cell
  const lastRow  = sheet.getLastRow();
  const statusCol = 7;
  const statusCell = sheet.getRange(lastRow, statusCol);
  const statusVal  = (data.status || "pending").toLowerCase();
  if (statusVal === "pending")     statusCell.setBackground("#FFF8E1").setFontColor("#D4A000");
  if (statusVal === "in_progress") statusCell.setBackground("#E3F2FD").setFontColor("#006FA6");
  if (statusVal === "delivered")   statusCell.setBackground("#E8F5E9").setFontColor("#00A86B");

  Logger.log("Row appended: " + data.request_id);
}

// ── Optional: Supabase sync (run on a time-trigger) ───────
// Set a daily trigger: Triggers → Add Trigger → syncFromSupabase → Time-based → Day timer
function syncFromSupabase() {
  const scriptProps = PropertiesService.getScriptProperties();
  const sbUrl = scriptProps.getProperty("SUPABASE_URL");
  const sbKey = scriptProps.getProperty("SUPABASE_ANON_KEY");

  if (!sbUrl || !sbKey) {
    Logger.log("Supabase not configured in Script Properties");
    return;
  }

  const url = `${sbUrl}/rest/v1/requests?select=*&order=submitted_at.desc&limit=200`;
  const resp = UrlFetchApp.fetch(url, {
    headers: {
      "apikey": sbKey,
      "Authorization": `Bearer ${sbKey}`
    }
  });

  const rows = JSON.parse(resp.getContentText());
  Logger.log(`Synced ${rows.length} rows from Supabase`);

  // Update status for each request
  rows.forEach(row => {
    updateStatusInSheet(row.request_id, row.status);
  });
}

function updateStatusInSheet(requestId, newStatus) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const data    = sheet.getDataRange().getValues();
  const idCol   = 0;  // Column A (0-indexed)
  const statCol = 6;  // Column G

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === requestId) {
      sheet.getRange(i + 1, statCol + 1).setValue(newStatus);
      Logger.log(`Updated ${requestId} → ${newStatus}`);
      return;
    }
  }
}
