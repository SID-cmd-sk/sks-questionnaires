/**
 * SKS Scantech — Google Apps Script
 * ====================================
 * Handles TWO things in ONE web app:
 *   1. Upload the submission ZIP to Google Drive
 *   2. Log the submission row to Google Sheets
 *
 * Deploy as a Web App:
 *   Extensions → Apps Script → paste this → Save
 *   Deploy → New deployment → Web App
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Copy the Web App URL into env.js → GSHEET_WEBAPP_URL
 * (Same URL handles both Drive upload + Sheets logging)
 */

// ── Config ────────────────────────────────────────────────────
const SHEET_NAME     = "SKS Submissions";
const DRIVE_FOLDER   = "SKS Submissions";   // Google Drive folder name
const SPREADSHEET_ID = "";                   // Leave empty = bound spreadsheet

// ── Column headers ────────────────────────────────────────────
const HEADERS = [
  "Request ID", "Customer Name", "Company",
  "Machine(s)", "Controller(s)", "Date Submitted",
  "Status", "Drive File", "Email", "Contact", "Machine Count"
];

// ═══════════════════════════════════════════════════════════════
// POST HANDLER — routes by action field
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "upload_zip") {
      return handleDriveUpload(data);
    } else {
      return handleSheetAppend(data);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── GET: health check ─────────────────────────────────────────
function doGet() {
  return jsonResponse({ status: "ok", sheet: SHEET_NAME, folder: DRIVE_FOLDER });
}

// ═══════════════════════════════════════════════════════════════
// DRIVE UPLOAD
// Receives base64-encoded ZIP, saves to Drive, returns share URL
// ═══════════════════════════════════════════════════════════════
function handleDriveUpload(data) {
  if (!data.file_base64 || !data.filename) {
    return jsonResponse({ success: false, error: "Missing file_base64 or filename" });
  }

  const folder = getOrCreateFolder(DRIVE_FOLDER);
  const bytes  = Utilities.base64Decode(data.file_base64);
  const blob   = Utilities.newBlob(bytes, "application/zip", data.filename);
  const file   = folder.createFile(blob);

  // Make viewable by anyone with the link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId      = file.getId();
  const viewUrl     = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
  const downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

  Logger.log("Drive upload: " + data.filename + " → " + fileId);

  return jsonResponse({
    success:      true,
    file_id:      fileId,
    file_url:     viewUrl,
    download_url: downloadUrl
  });
}

// ── Get or create a Drive folder by name ─────────────────────
function getOrCreateFolder(name) {
  const existing = DriveApp.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(name);
}

// ═══════════════════════════════════════════════════════════════
// SHEETS APPEND
// ═══════════════════════════════════════════════════════════════
function handleSheetAppend(data) {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const hRow = sheet.getRange(1, 1, 1, HEADERS.length);
    hRow.setValues([HEADERS]);
    hRow.setFontWeight("bold");
    hRow.setBackground("#CC0000");
    hRow.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(8, 300);
  }

  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

  const driveUrl = data.file_url || "";
  const driveCell = driveUrl
    ? '=HYPERLINK("' + driveUrl + '","📁 Download")'
    : "";

  sheet.appendRow([
    data.request_id    || "",
    data.customer_name || "",
    data.company       || "",
    data.machine       || "",
    data.controller    || "",
    data.date          || now,
    data.status        || "Pending",
    driveCell,
    data.email         || "",
    data.contact       || "",
    data.machine_count || ""
  ]);

  const lastRow    = sheet.getLastRow();
  const statusCell = sheet.getRange(lastRow, 7);
  const statusVal  = (data.status || "pending").toLowerCase();
  if (statusVal === "pending")     statusCell.setBackground("#FFF8E1").setFontColor("#D4A000");
  if (statusVal === "in_progress") statusCell.setBackground("#E3F2FD").setFontColor("#006FA6");
  if (statusVal === "delivered")   statusCell.setBackground("#E8F5E9").setFontColor("#00A86B");

  Logger.log("Row appended: " + data.request_id);
  return jsonResponse({ success: true });
}

function updateStatusInSheet(requestId, newStatus) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const data    = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === requestId) {
      const cell = sheet.getRange(i + 1, 7);
      cell.setValue(newStatus);
      const s = newStatus.toLowerCase();
      if (s === "pending")     cell.setBackground("#FFF8E1").setFontColor("#D4A000");
      if (s === "in_progress") cell.setBackground("#E3F2FD").setFontColor("#006FA6");
      if (s === "delivered")   cell.setBackground("#E8F5E9").setFontColor("#00A86B");
      return;
    }
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
