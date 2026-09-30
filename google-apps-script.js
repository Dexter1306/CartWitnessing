/**
 * =========================================================================
 * CART WITNESSING SCHEDULE — GOOGLE SHEETS BACKEND SYNC SCRIPT
 * =========================================================================
 * 
 * This Google Apps Script connects your Cart Witnessing Web App to Google Sheets.
 * It synchronizes shifts in real time across PC, mobile phones, and volunteers,
 * and automatically maintains a clean, human-readable roster in your spreadsheet!
 * 
 * -------------------------------------------------------------------------
 * EASY 2-MINUTE SETUP INSTRUCTIONS:
 * -------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.new) and name it:
 *    "Cart Witnessing Schedule"
 * 
 * 2. In the top menu, click:
 *    Extensions > Apps Script
 * 
 * 3. Delete any code already in the editor, and paste ALL of this code.
 * 
 * 4. Click the blue "Deploy" button at the top right > "New deployment".
 * 
 * 5. In the modal that opens:
 *    - Click the gear icon (⚙️) next to "Select type" and choose: "Web app"
 *    - Description: "Cart Witnessing Sync API"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"  <-- IMPORTANT! Allows phone & PC to sync
 * 
 * 6. Click "Deploy".
 *    - If asked, click "Authorize access", choose your Google account.
 *    - (If Google shows "Google hasn't verified this app", click "Advanced" > "Go to Untitled project (unsafe)").
 * 
 * 7. Copy the "Web app URL" (it starts with https://script.google.com/macros/s/...).
 * 
 * 8. Open your Cart Witnessing App > Tap "Keyman" > Login (PIN 1234) >
 *    Paste the Web App URL under "Google Sheets Cloud Sync" > Tap "Save & Connect".
 * 
 * That's it! Every device will now stay in sync automatically!
 * =========================================================================
 */

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const dateKey = params.date;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure "Data_Store" sheet exists
    let storeSheet = ss.getSheetByName("Data_Store");
    if (!storeSheet) {
      storeSheet = ss.insertSheet("Data_Store");
      storeSheet.appendRow(["DateKey", "ScheduleJSON", "LastUpdated"]);
      storeSheet.getRange("A1:C1").setFontWeight("bold").setBackground("#f1f5f9");
    }
    
    // If specific date requested
    if (dateKey) {
      const data = storeSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(dateKey)) {
          let schedule = null;
          try { schedule = JSON.parse(data[i][1]); } catch(ex) {}
          return createJsonResponse({
            status: 'success',
            dateKey: dateKey,
            data: schedule,
            lastUpdated: data[i][2] || ''
          });
        }
      }
      return createJsonResponse({ status: 'not_found', dateKey: dateKey, data: null });
    }
    
    // Ping/Status check
    return createJsonResponse({
      status: 'success',
      message: 'Cart Witnessing Google Sheets Sync API is active!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const contents = e.postData ? e.postData.contents : '';
    if (!contents) {
      return createJsonResponse({ status: 'error', message: 'No payload received' });
    }
    
    const payload = JSON.parse(contents);
    const dateKey = payload.dateKey;
    const scheduleData = payload.data;
    
    if (!dateKey || !scheduleData) {
      return createJsonResponse({ status: 'error', message: 'Missing dateKey or schedule data' });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Store in Data_Store sheet
    let storeSheet = ss.getSheetByName("Data_Store");
    if (!storeSheet) {
      storeSheet = ss.insertSheet("Data_Store");
      storeSheet.appendRow(["DateKey", "ScheduleJSON", "LastUpdated"]);
      storeSheet.getRange("A1:C1").setFontWeight("bold").setBackground("#f1f5f9");
    }
    
    const rows = storeSheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(dateKey)) {
        rowIndex = i + 1; // 1-based row index
        break;
      }
    }
    
    const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    const jsonStr = JSON.stringify(scheduleData);
    
    if (rowIndex > 0) {
      storeSheet.getRange(rowIndex, 2).setValue(jsonStr);
      storeSheet.getRange(rowIndex, 3).setValue(nowStr);
    } else {
      storeSheet.appendRow([dateKey, jsonStr, nowStr]);
    }
    
    // 2. Format a human-readable live roster tab in Google Sheets
    try {
      updateHumanReadableRoster(ss, dateKey, scheduleData, nowStr);
    } catch(sheetErr) {
      // Non-fatal if formatting tab has an issue
      console.warn("Could not update readable sheet:", sheetErr);
    }
    
    return createJsonResponse({
      status: 'success',
      message: 'Schedule saved and synced successfully',
      dateKey: dateKey,
      lastUpdated: nowStr
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function updateHumanReadableRoster(ss, dateKey, scheduleData, updatedTime) {
  const sheetName = "Roster_" + dateKey;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }
  
  // Title & Meta
  sheet.appendRow(["CART WITNESSING ROSTER", "", "", "", ""]);
  sheet.appendRow(["Date: " + dateKey, "Last Synced: " + updatedTime, "", "", ""]);
  sheet.appendRow([""]);
  sheet.appendRow(["Location & Landmark", "Shift & Time", "Volunteer 1", "Volunteer 2", "Volunteer 3"]);
  
  const locations = [
    { id: 'L1', name: 'Location 1 (Balwarte)' },
    { id: 'L2', name: 'Location 2 (Gesen)' },
    { id: 'L3', name: 'Location 3 (Kanlaon / Villarica Pawnshop)' },
    { id: 'L4', name: 'Location 4 (Multipurpose / Brgy. Outpost sa Tapat ng Metroplaza)' },
    { id: 'L5', name: 'Location 5 (Phase 5 / 7-Eleven)' }
  ];
  
  const shiftDefs = [
    { name: "Shift 1: Morning", time: "06:30 AM - 08:30 AM" },
    { name: "Shift 2: Afternoon", time: "04:30 PM - 06:00 PM" }
  ];
  
  locations.forEach(loc => {
    const locShifts = scheduleData[loc.id] || [];
    [0, 1].forEach(sIdx => {
      const s = locShifts[sIdx] || { p1:{name:''}, p2:{name:''}, p3:{name:''} };
      const v1 = (s.p1 && s.p1.name && s.p1.name.trim()) ? s.p1.name.trim() : "— Available —";
      const v2 = (s.p2 && s.p2.name && s.p2.name.trim()) ? s.p2.name.trim() : "— Available —";
      const v3 = (s.p3 && s.p3.name && s.p3.name.trim()) ? s.p3.name.trim() : "— Available —";
      sheet.appendRow([loc.name, shiftDefs[sIdx].name + " (" + shiftDefs[sIdx].time + ")", v1, v2, v3]);
    });
  });
  
  // Formatting
  sheet.getRange("A1:E1").setFontSize(13).setFontWeight("bold").setBackground("#1e40af").setFontColor("#ffffff");
  sheet.getRange("A2:E2").setFontSize(9).setFontStyle("italic").setFontColor("#475569");
  sheet.getRange("A4:E4").setFontWeight("bold").setBackground("#f1f5f9").setFontColor("#0f172a");
  
  // Set borders
  const totalRows = sheet.getLastRow();
  if (totalRows >= 4) {
    sheet.getRange(4, 1, totalRows - 3, 5).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  
  sheet.autoResizeColumns(1, 5);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
