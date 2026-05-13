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
 *
 * IMPORTANT — SPREADSHEET_ID:
 *   If deployed as a STANDALONE script (not bound to a sheet),
 *   you MUST set SPREADSHEET_ID to your Google Sheet's ID.
 *   Find it in the Sheet URL: .../spreadsheets/d/SPREADSHEET_ID/edit
 *   Leave empty ONLY if this script is bound to the target sheet.
 */

// ── Config ────────────────────────────────────────────────────
const SHEET_NAME     = "SKS Submissions";
const DRIVE_FOLDER   = "SKS Submissions";   // Google Drive folder name (display only)
const DRIVE_FOLDER_ID = "12cOfmeyNQL7Te0y6Ce1pgD0vbe_bc-FH"; // Fixed folder ID — faster, no search needed
const SPREADSHEET_ID = "";                   // Set this if standalone (not bound to a sheet)

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
    Logger.log("doPost error: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── GET: health check ─────────────────────────────────────────
function doGet() {
  return jsonResponse({ status: "ok", sheet: SHEET_NAME, folder: DRIVE_FOLDER });
}

// ── OPTIONS: satisfy CORS preflight (belt-and-suspenders) ────
function doOptions() {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ═══════════════════════════════════════════════════════════════
// DRIVE UPLOAD
// Receives base64-encoded ZIP, saves to Drive, returns share URL.
// Deduplicates filenames by appending a counter suffix.
// ═══════════════════════════════════════════════════════════════
function handleDriveUpload(data) {
  if (!data.file_base64 || !data.filename) {
    return jsonResponse({ success: false, error: "Missing file_base64 or filename" });
  }

  try {
    const folder   = getOrCreateFolder();
    const filename = deduplicateFilename(folder, data.filename);
    const bytes    = Utilities.base64Decode(data.file_base64);
    const blob     = Utilities.newBlob(bytes, "application/zip", filename);
    const file     = folder.createFile(blob);

    // Make viewable by anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId      = file.getId();
    const viewUrl     = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
    const downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

    Logger.log("Drive upload: " + filename + " → " + fileId);

    return jsonResponse({
      success:      true,
      file_id:      fileId,
      file_url:     viewUrl,
      download_url: downloadUrl,
      filename:     filename
    });
  } catch (err) {
    Logger.log("handleDriveUpload error: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── Deduplicate filename within a folder ──────────────────────
// If "file.zip" exists, returns "file_2.zip", "file_3.zip", etc.
function deduplicateFilename(folder, filename) {
  const dotIdx  = filename.lastIndexOf('.');
  const base    = dotIdx >= 0 ? filename.slice(0, dotIdx) : filename;
  const ext     = dotIdx >= 0 ? filename.slice(dotIdx)    : '';
  let   name    = filename;
  let   counter = 2;

  while (folder.getFilesByName(name).hasNext()) {
    name = base + '_' + counter + ext;
    counter++;
  }
  return name;
}

// ── Get Drive folder by fixed ID ─────────────────────────────
function getOrCreateFolder() {
  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

// ═══════════════════════════════════════════════════════════════
// SHEETS APPEND
// ═══════════════════════════════════════════════════════════════
function handleSheetAppend(data) {
  try {
    const ss = getSpreadsheet();
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

    const driveUrl  = data.file_url || "";
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
  } catch (err) {
    Logger.log("handleSheetAppend error: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── Get spreadsheet (standalone or bound) ────────────────────
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  // Bound script — getActiveSpreadsheet() works only when bound
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "No spreadsheet found. Set SPREADSHEET_ID in the script config " +
      "if this is a standalone (not bound) deployment."
    );
  }
  return ss;
}

function updateStatusInSheet(requestId, newStatus) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
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
  } catch (err) {
    Logger.log("updateStatusInSheet error: " + err.message);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
