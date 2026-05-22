/* ============================================================
   WealthBridge — Google Apps Script Webhook
   ============================================================
   PURPOSE:
     • Receives form submissions from the website contact form
     • Saves each lead to a Google Sheet (auto-creates columns)
     • Sends an email notification for every new lead
     • Returns success/failure JSON response

   ── SETUP INSTRUCTIONS (one-time, ~10 minutes) ─────────────

   STEP 1 — Create Google Sheet
     1. Go to sheets.google.com
     2. Create a new spreadsheet
     3. Rename it: "WealthBridge Leads"
     4. Leave it open (you'll need its URL later)

   STEP 2 — Open Apps Script
     1. Inside the spreadsheet, click:
        Extensions → Apps Script
     2. Delete any code in the editor
     3. Paste ALL the code below (starting from "// ====")
     4. Click 💾 Save (Ctrl+S)

   STEP 3 — Deploy as Web App
     1. Click "Deploy" → "New Deployment"
     2. Click ⚙️ gear icon → "Web App"
     3. Set: Execute as        → "Me (your Google account)"
     4. Set: Who has access    → "Anyone"
     5. Click "Deploy"
     6. Authorize permissions when prompted (click "Allow")
     7. COPY the Web App URL shown (looks like:
        https://script.google.com/macros/s/AKfy.../exec)

   STEP 4 — Add URL to website config
     1. Open:  js/config.js  in your website folder
     2. Find:  sheetsWebhookUrl: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'
     3. Replace the placeholder with your copied URL
     4. Save the file and redeploy/push to Netlify

   STEP 5 — Update notification email
     1. In the Apps Script editor, find the line:
        var NOTIFY_EMAIL = 'Admin@wealthbridgeindia.com';
     2. Change it to whichever email should receive lead alerts
     3. Save and re-deploy (Deploy → Manage Deployments → Edit)

   ── TESTING ────────────────────────────────────────────────
     After deployment, submit the contact form on your website.
     Within ~30 seconds:
       ✓ A new row should appear in the Google Sheet
       ✓ An email notification should arrive at NOTIFY_EMAIL

   ── LEAD SHEET COLUMNS ────────────────────────────────────
     Timestamp | First Name | Last Name | Email | Phone |
     Interest | Message | Source Page

   ─────────────────────────────────────────────────────────
   PASTE EVERYTHING BELOW THIS LINE INTO APPS SCRIPT EDITOR:
   ============================================================ */

// ====================================================================
// WealthBridge Lead Capture — Google Apps Script
// ====================================================================

var NOTIFY_EMAIL = 'Admin@wealthbridgeindia.com'; // ← edit this
var SHEET_NAME   = 'Leads';

// ── Entry Point: Handle POST from website form ──────────────────────
function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    saveLead(data);
    sendNotification(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Handle GET (health check / test) ───────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'WealthBridge Lead Capture' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Save to Google Sheet ────────────────────────────────────────────
function saveLead(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  // Create sheet + header row if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'First Name', 'Last Name', 'Email',
      'Phone', 'Interest', 'Message', 'Source Page'
    ]);

    // Format header row
    var header = sheet.getRange(1, 1, 1, 8);
    header.setBackground('#0f2b4a');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Append lead row
  sheet.appendRow([
    data.timestamp  || new Date().toLocaleString('en-IN'),
    data.firstName  || '',
    data.lastName   || '',
    data.email      || '',
    data.phone      || '',
    data.interest   || '',
    data.message    || '',
    data.source     || ''
  ]);

  // Auto-resize columns for readability
  sheet.autoResizeColumns(1, 8);
}

// ── Send Email Notification ─────────────────────────────────────────
function sendNotification(data) {
  if (!NOTIFY_EMAIL) return;

  var fullName = (data.firstName || '') + ' ' + (data.lastName || '');
  var subject  = '🔔 New Lead — ' + (data.interest || 'General Enquiry') +
                 ' | WealthBridge (' + fullName.trim() + ')';

  var body =
    '============================\n' +
    'NEW LEAD — WEALTHBRIDGE\n' +
    '============================\n\n' +
    'Name:      ' + fullName.trim()       + '\n' +
    'Email:     ' + (data.email    || '') + '\n' +
    'Phone:     ' + (data.phone    || '') + '\n' +
    'Interest:  ' + (data.interest || '') + '\n' +
    'Source:    ' + (data.source   || '') + '\n' +
    'Time:      ' + (data.timestamp || new Date().toLocaleString('en-IN')) + '\n\n' +
    'Message:\n' + (data.message || '(none)') + '\n\n' +
    '----------------------------\n' +
    'Reply directly to this lead:\n' +
    'Email: ' + (data.email || '') + '\n' +
    'Phone: ' + (data.phone || '') + '\n' +
    '============================';

  var htmlBody =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
    '<div style="background:#0f2b4a;padding:24px 32px;border-radius:8px 8px 0 0;">' +
    '<h2 style="color:#fff;margin:0;font-size:20px;">🔔 New Lead — WealthBridge</h2>' +
    '</div>' +
    '<div style="background:#f9fafb;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;">' +
    '<table style="width:100%;border-collapse:collapse;">' +
    row('Name',     fullName.trim())           +
    row('Email',    data.email    || '—')      +
    row('Phone',    data.phone    || '—')      +
    row('Interest', data.interest || '—')      +
    row('Source',   data.source   || '—')      +
    row('Time',     data.timestamp || new Date().toLocaleString('en-IN')) +
    '</table>' +
    '<div style="margin-top:20px;padding:16px;background:#fff;border-radius:6px;border:1px solid #e5e7eb;">' +
    '<strong style="color:#0f2b4a;">Message:</strong>' +
    '<p style="margin:8px 0 0;color:#374151;">' + (data.message || '<em>No message provided</em>') + '</p>' +
    '</div>' +
    '<div style="margin-top:20px;display:flex;gap:12px;">' +
    '<a href="mailto:' + (data.email||'') + '" style="display:inline-block;background:#0f2b4a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Reply by Email</a>' +
    '<a href="tel:' + (data.phone||'').replace(/\s/g,'') + '" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">📞 Call Lead</a>' +
    '</div>' +
    '</div>' +
    '<div style="background:#e5e7eb;padding:12px 32px;border-radius:0 0 8px 8px;font-size:12px;color:#6b7280;text-align:center;">' +
    'WealthBridge Lead Capture System — Powered by Google Apps Script' +
    '</div></div>';

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body, { htmlBody: htmlBody });
}

// Helper for HTML email rows
function row(label, value) {
  return '<tr>' +
    '<td style="padding:8px 0;color:#6b7280;font-size:14px;width:100px;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">' + value + '</td>' +
    '</tr>';
}
