const SHEET_NAME      = "SKS Submissions";
const DRIVE_FOLDER    = "SKS Submissions";
const DRIVE_FOLDER_ID = "12cOfmeyNQL7Te0y6Ce1pgD0vbe_bc-FH";
const SPREADSHEET_ID  = "";
const HEADERS = [
  "Request ID", "Customer Name", "Company",
  "Machine(s)", "Controller(s)", "Date Submitted",
  "Status", "Drive File", "Email", "Contact", "Machine Count"
];
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return data.action === "upload_zip" ? handleDriveUpload(data) : handleSheetAppend(data);
  } catch (err) {
    Logger.log("doPost error: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}
function doGet() {
  return jsonResponse({ status: "ok", sheet: SHEET_NAME, folder: DRIVE_FOLDER });
}
function doOptions() {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
function handleDriveUpload(data) {
  if (!data.file_base64 || !data.filename)
    return jsonResponse({ success: false, error: "Missing file_base64 or filename" });
  try {
    const folder   = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const filename = deduplicateFilename(folder, data.filename);
    const bytes    = Utilities.base64Decode(data.file_base64);
    const file     = folder.createFile(Utilities.newBlob(bytes, "application/zip", filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = file.getId();
    Logger.log("Drive upload: " + filename + " → " + fileId);
    return jsonResponse({
      success:      true,
      file_id:      fileId,
      file_url:     "https:
      download_url: "https:
      filename:     filename
    });
  } catch (err) {
    Logger.log("handleDriveUpload error: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}
function deduplicateFilename(folder, filename) {
  const dotIdx = filename.lastIndexOf('.');
  const base   = dotIdx >= 0 ? filename.slice(0, dotIdx) : filename;
  const ext    = dotIdx >= 0 ? filename.slice(dotIdx) : '';
  let name = filename, counter = 2;
  while (folder.getFilesByName(name).hasNext()) name = base + '_' + counter++ + ext;
  return name;
}
function handleSheetAppend(data) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const hRow = sheet.getRange(1, 1, 1, HEADERS.length);
      hRow.setValues([HEADERS]).setFontWeight("bold").setBackground("#CC0000").setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
      [1,2,4,8].forEach((c,i) => sheet.setColumnWidth(c, [180,180,220,300][i]));
    }
    const now      = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    const driveUrl = data.file_url || "";
    sheet.appendRow([
      data.request_id || "", data.customer_name || "", data.company || "",
      data.machine || "", data.controller || "", data.date || now,
      data.status || "Pending",
      driveUrl ? '=HYPERLINK("' + driveUrl + '","📁 Download")' : "",
      data.email || "", data.contact || "", data.machine_count || ""
    ]);
    const cell = sheet.getRange(sheet.getLastRow(), 7);
    const s    = (data.status || "pending").toLowerCase();
    if (s === "pending")     cell.setBackground("#FFF8E1").setFontColor("#D4A000");
    if (s === "in_progress") cell.setBackground("#E3F2FD").setFontColor("#006FA6");
    if (s === "delivered")   cell.setBackground("#E8F5E9").setFontColor("#00A86B");
    Logger.log("Row appended: " + data.request_id);
    return jsonResponse({ success: true });
  } catch (err) {
    Logger.log("handleSheetAppend error: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim())
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Set SPREADSHEET_ID for standalone deployment.");
  return ss;
}
function updateStatusInSheet(requestId, newStatus) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        const cell = sheet.getRange(i + 1, 7).setValue(newStatus);
        const s = newStatus.toLowerCase();
        if (s === "pending")     cell.setBackground("#FFF8E1").setFontColor("#D4A000");
        if (s === "in_progress") cell.setBackground("#E3F2FD").setFontColor("#006FA6");
        if (s === "delivered")   cell.setBackground("#E8F5E9").setFontColor("#00A86B");
        return;
      }
    }
  } catch (err) { Logger.log("updateStatusInSheet error: " + err.message); }
}
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
