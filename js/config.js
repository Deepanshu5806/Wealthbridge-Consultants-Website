/* ============================================================
   WealthBridge — Centralized Configuration
   ============================================================
   EDIT THIS FILE to update all contact details, routing,
   and WhatsApp messages across the entire website.
   No other file needs to be touched for contact info changes.
   ============================================================ */

var WB = {

  /* ── Contact Details ──────────────────────────────────────── */
  contacts: {
    globalMarkets: {
      phone:     '+919311778137',
      phoneFmt:  '+91 93117 78137',
      whatsapp:  '919311778137',
      email:     'Admin@wealthbridgeindia.com',
      label:     'Global Markets Team'
    },
    privateEquity: {
      phone:     '+919013332500',
      phoneFmt:  '+91 90133 32500',
      whatsapp:  '919013332500',
      email:     'Admin@wealthbridgeindia.com',
      label:     'Private Equity Team'
    },
    general: {
      phone:     '+919311778137',
      phoneFmt:  '+91 93117 78137',
      phone2:    '+919013332500',
      phoneFmt2: '+91 90133 32500',
      whatsapp:  '919311778137',
      email:     'info@wealthbridge.com',
      label:     'WealthBridge Team'
    }
  },

  /* ── WhatsApp Pre-filled Messages ────────────────────────── */
  messages: {
    globalMarkets: 'Hi WealthBridge, I am interested in Global Market investment opportunities.',
    privateEquity: 'Hi WealthBridge, I am interested in Private Equity / Unlisted Share investment opportunities.',
    goldenVisa:    'Hi WealthBridge, I am interested in Golden Visa advisory services.',
    otherServices: 'Hi WealthBridge, I am interested in your estate planning / legal advisory services (Wills, Trusts, Succession Planning).',
    general:       'Hi WealthBridge, I would like to schedule a free consultation.',
    shareEnquiry:  function (shareName) {
      return 'Hi WealthBridge, I am interested in ' + shareName + ' (Unlisted Share). Please share the latest price and availability.';
    }
  },

  /* ── Google Sheets Webhook ───────────────────────────────────
     Replace the placeholder below with your deployed
     Google Apps Script Web App URL.
     See: google-apps-script.js for step-by-step instructions.
  ─────────────────────────────────────────────────────────── */
  sheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbxllKQMtIvQcfWSTqAxh0n7cGxJLNsdxA7NQmmfgn_Us1JVMdwUJIxgfnOTAKTHFUq-/exec',

  /* ── Form Shared Secret (anti-spam) ──────────────────────────
     This MUST match the WB_FORM_SECRET value you set in
     Apps Script → Project Settings → Script Properties.
     Without a match, the script rejects the submission.
     If this is ever leaked, rotate it in both places.
     Note: any client-side secret is visible to a determined
     attacker. This raises the cost of spam, not stops it
     entirely — combine with the daily cap in Apps Script.
  ─────────────────────────────────────────────────────────── */
  formSecret: '713c8af0-c5e4-4cfe-9f18-539c04b64504992b00b5-c0e5-4b18-aa37-94d786050a43',

  /* ── Notification Email ──────────────────────────────────────
     Leads will be emailed here via Apps Script.
     Edit in your Apps Script dashboard (not here).
  ─────────────────────────────────────────────────────────── */
  notificationEmail: 'Admin@wealthbridgeindia.com'

};
