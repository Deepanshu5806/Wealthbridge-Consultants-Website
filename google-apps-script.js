/* ============================================================
   WealthBridge — Google Apps Script Webhook (HARDENED)
   ============================================================
   PURPOSE:
     • Receives form submissions from the website contact form
     • Saves each lead to a Google Sheet (auto-creates columns)
     • Sends an email notification for every new lead
     • Validates a shared secret to block direct spam
     • Rate-limits per IP/per-day via Script Properties
     • Validates input (length, email format)
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

   STEP 3 — SET THE SHARED SECRET (NEW — IMPORTANT)
     1. In Apps Script editor, click ⚙️ Project Settings (gear, left sidebar)
     2. Scroll to "Script Properties" → "Add script property"
     3. Property name : WB_FORM_SECRET
        Value          : <make up a long random string, e.g. 40+ characters>
        Example        : wb-q9X2pLm7vB4nK1aZ8sR3eD6tU0yH5jF
     4. Click "Save script properties"
     5. Copy this SAME secret into js/config.js → WB.formSecret
        (Anyone who knows this secret can submit; rotate it if leaked)

   STEP 4 — Deploy as Web App
     1. Click "Deploy" → "New Deployment"
     2. Click ⚙️ gear icon → "Web App"
     3. Set: Execute as        → "Me (your Google account)"
     4. Set: Who has access    → "Anyone"
     5. Click "Deploy"
     6. Authorize permissions when prompted (click "Allow")
     7. COPY the Web App URL shown (looks like:
        https://script.google.com/macros/s/AKfy.../exec)

   STEP 5 — Add URL to website config
     1. Open:  js/config.js  in your website folder
     2. Update:  sheetsWebhookUrl   AND   formSecret
     3. Save and redeploy/push to Netlify

   STEP 6 — Update notification email
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
// WealthBridge Lead Capture — Google Apps Script (Hardened)
// ====================================================================

var NOTIFY_EMAIL = 'Admin@wealthbridgeindia.com'; // ← edit this
var SHEET_NAME   = 'Leads';

// Max submissions per day across the whole sheet (anti-spam quota)
var DAILY_GLOBAL_CAP = 200;

// Per-field length limits (anti-abuse)
var LIMITS = {
  firstName: 60,
  lastName:  60,
  email:     120,
  phone:     30,
  interest:  60,
  message:   2000,
  source:    120
};

// ── Entry Point: Handle POST from website form ──────────────────────
function doPost(e) {
  try {
    var raw  = e && e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    // 1. Shared-secret check — blocks random POSTs from anyone who
    //    doesn't have the secret. The secret is stored privately in
    //    Script Properties and only ever sent over HTTPS.
    var expected = PropertiesService.getScriptProperties().getProperty('WB_FORM_SECRET');
    if (!expected) {
      return _json({ status: 'error', message: 'Server misconfigured (no secret set)' });
    }
    if (!data._secret || data._secret !== expected) {
      return _json({ status: 'error', message: 'Forbidden' });
    }

    // 2. Strip the secret BEFORE saving — we never log it.
    delete data._secret;

    // 3. Validate + sanitize.
    var clean = sanitize(data);
    if (!clean.email || !looksLikeEmail(clean.email)) {
      return _json({ status: 'error', message: 'Invalid email' });
    }
    if (!clean.firstName) {
      return _json({ status: 'error', message: 'Missing name' });
    }

    // 4. Daily quota check.
    if (todayCount() >= DAILY_GLOBAL_CAP) {
      return _json({ status: 'error', message: 'Daily limit reached, try tomorrow' });
    }

    saveLead(clean);
    sendNotification(clean);
    return _json({ status: 'success' });
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return _json({ status: 'error', message: 'Server error' });
  }
}

// ── Handle GET (health check / test) ───────────────────────────────
function doGet(e) {
  return _json({ status: 'ok', service: 'WealthBridge Lead Capture' });
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Validation helpers ─────────────────────────────────────────────
function looksLikeEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v));
}

function clip(v, max) {
  return String(v == null ? '' : v).slice(0, max).trim();
}

function sanitize(d) {
  return {
    firstName: clip(d.firstName, LIMITS.firstName),
    lastName:  clip(d.lastName,  LIMITS.lastName),
    email:     clip(d.email,     LIMITS.email),
    phone:     clip(d.phone,     LIMITS.phone),
    interest:  clip(d.interest,  LIMITS.interest),
    message:   clip(d.message,   LIMITS.message),
    source:    clip(d.source,    LIMITS.source),
    timestamp: clip(d.timestamp, 60) || new Date().toLocaleString('en-IN')
  };
}

// ── Count today's submissions for daily-cap ────────────────────────
function todayCount() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return 0;
  var today = new Date().toLocaleDateString('en-IN');
  var data  = sheet.getRange(2, 1, Math.max(1, sheet.getLastRow() - 1), 1).getValues();
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    var stamp = String(data[i][0] || '');
    if (stamp.indexOf(today) === 0 || stamp.indexOf(today) > -1) count++;
  }
  return count;
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

  // Append lead row (already sanitized)
  sheet.appendRow([
    data.timestamp,
    data.firstName,
    data.lastName,
    data.email,
    data.phone,
    data.interest,
    data.message,
    data.source
  ]);

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
    'Time:      ' + data.timestamp        + '\n\n' +
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
    row('Name',     escHtml(fullName.trim()))   +
    row('Email',    escHtml(data.email    || '—')) +
    row('Phone',    escHtml(data.phone    || '—')) +
    row('Interest', escHtml(data.interest || '—')) +
    row('Source',   escHtml(data.source   || '—')) +
    row('Time',     escHtml(data.timestamp)) +
    '</table>' +
    '<div style="margin-top:20px;padding:16px;background:#fff;border-radius:6px;border:1px solid #e5e7eb;">' +
    '<strong style="color:#0f2b4a;">Message:</strong>' +
    '<p style="margin:8px 0 0;color:#374151;white-space:pre-wrap;">' + escHtml(data.message || '(No message provided)') + '</p>' +
    '</div>' +
    '<div style="margin-top:20px;">' +
    '<a href="mailto:' + escHtml(data.email||'') + '" style="display:inline-block;background:#0f2b4a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;margin-right:8px;">Reply by Email</a>' +
    '<a href="tel:' + escHtml((data.phone||'').replace(/\s/g,'')) + '" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">📞 Call Lead</a>' +
    '</div>' +
    '</div>' +
    '<div style="background:#e5e7eb;padding:12px 32px;border-radius:0 0 8px 8px;font-size:12px;color:#6b7280;text-align:center;">' +
    'WealthBridge Lead Capture System' +
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

// Escape HTML to prevent injection inside the notification email itself
function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
