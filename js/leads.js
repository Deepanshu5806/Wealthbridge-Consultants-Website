/* ============================================================
   WealthBridge — Lead Capture & Communication Engine
   ============================================================
   Handles:
   • Floating WhatsApp button (all pages)
   • WhatsApp CTA routing (department-aware)
   • Phone / Call links
   • Contact form: validation, async submit, loading states
   • Google Sheets webhook integration
   • Anti-spam (honeypot)
   ============================================================ */

(function () {
  'use strict';

  /* ── Utility ──────────────────────────────────────────────── */
  function trim(v) { return v ? String(v).trim() : ''; }

  function buildWaUrl(number, message) {
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  }

  /* ── Public: Open WhatsApp ────────────────────────────────── */
  window.wbWhatsApp = function (dept, shareName) {
    var contact, message;
    switch (dept) {
      case 'globalMarkets':
        contact = WB.contacts.globalMarkets;
        message = WB.messages.globalMarkets;
        break;
      case 'privateEquity':
        contact = WB.contacts.privateEquity;
        message = shareName
          ? WB.messages.shareEnquiry(shareName)
          : WB.messages.privateEquity;
        break;
      case 'goldenVisa':
        contact = WB.contacts.general;
        message = WB.messages.goldenVisa;
        break;
      case 'otherServices':
        contact = WB.contacts.general;
        message = WB.messages.otherServices;
        break;
      default:
        contact = WB.contacts.general;
        message = WB.messages.general;
    }
    window.open(buildWaUrl(contact.whatsapp, message), '_blank', 'noopener,noreferrer');
  };

  /* ── Public: Call ─────────────────────────────────────────── */
  window.wbCall = function (dept) {
    var phone;
    switch (dept) {
      case 'privateEquity':  phone = WB.contacts.privateEquity.phone; break;
      case 'globalMarkets':  phone = WB.contacts.globalMarkets.phone; break;
      default:               phone = WB.contacts.general.phone;
    }
    window.location.href = 'tel:' + phone;
  };

  /* ── Floating WhatsApp Button ─────────────────────────────── */
  function injectFloatingWhatsApp() {
    if (document.getElementById('wb-wa-float')) return;

    var btn = document.createElement('a');
    btn.id        = 'wb-wa-float';
    btn.href      = buildWaUrl(WB.contacts.general.whatsapp, WB.messages.general);
    btn.target    = '_blank';
    btn.rel       = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Chat with WealthBridge on WhatsApp');
    btn.innerHTML = '<i class="fab fa-whatsapp wb-wa-icon"></i><span class="wb-wa-label">Chat with Us</span>';
    document.body.appendChild(btn);

    /* Show after 2 s, hide when at very top */
    setTimeout(function () { btn.classList.add('wb-wa-visible'); }, 2000);
    window.addEventListener('scroll', function () {
      if (window.scrollY > 200) {
        btn.classList.add('wb-wa-visible');
      } else {
        btn.classList.remove('wb-wa-visible');
      }
    }, { passive: true });
  }

  /* ── Validation ───────────────────────────────────────────── */
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function isValidPhone(v) {
    /* Accepts: 10-digit Indian, +91XXXXXXXXXX, 00XXXXXXX, international */
    var c = v.replace(/[\s\-().+]/g, '');
    return /^(\d{10}|91\d{10}|00\d{8,15}|\+\d{8,15})$/.test(c);
  }

  function getValidationErrors(data) {
    var errs = [];
    if (!data.firstName) errs.push({ id: 'wb-first-name', msg: 'First name is required.' });
    if (!data.lastName)  errs.push({ id: 'wb-last-name',  msg: 'Last name is required.' });
    if (!data.email || !isValidEmail(data.email))
      errs.push({ id: 'wb-email', msg: 'Please enter a valid email address.' });
    if (!data.phone || !isValidPhone(data.phone))
      errs.push({ id: 'wb-phone', msg: 'Please enter a valid phone number (e.g. 9876543210).' });
    if (!data.interest)
      errs.push({ id: 'wb-interest', msg: 'Please select your area of interest.' });
    return errs;
  }

  function setFieldError(fieldEl, msg) {
    if (!fieldEl) return;
    fieldEl.classList.add('wb-field-error');
    var hint = fieldEl.parentNode.querySelector('.wb-error-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'wb-error-hint';
      fieldEl.parentNode.appendChild(hint);
    }
    hint.textContent = msg;
  }

  function clearFieldError(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove('wb-field-error');
    var hint = fieldEl.parentNode.querySelector('.wb-error-hint');
    if (hint) hint.remove();
  }

  function showErrors(form, errs) {
    errs.forEach(function (e) {
      setFieldError(form.querySelector('#' + e.id), e.msg);
    });
    /* Focus first broken field */
    var first = form.querySelector('.wb-field-error');
    if (first) first.focus();
  }

  function validateSingleField(el) {
    var v   = trim(el.value);
    var id  = el.id;
    var msg = '';
    if (id === 'wb-first-name' && !v)                         msg = 'First name is required.';
    if (id === 'wb-last-name'  && !v)                         msg = 'Last name is required.';
    if (id === 'wb-email'      && (!v || !isValidEmail(v)))   msg = 'Please enter a valid email address.';
    if (id === 'wb-phone'      && (!v || !isValidPhone(v)))   msg = 'Please enter a valid phone number.';
    if (id === 'wb-interest'   && !v)                         msg = 'Please select your area of interest.';
    if (msg) setFieldError(el, msg);
    else     clearFieldError(el);
  }

  /* ── Submit Button State ──────────────────────────────────── */
  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = '<span class="wb-btn-spinner"></span>Sending…';
      btn.classList.add('wb-btn-loading');
    } else {
      btn.innerHTML = btn.dataset.original || 'Send Message <i class="fas fa-paper-plane"></i>';
      btn.classList.remove('wb-btn-loading');
    }
  }

  /* ── Google Sheets Webhook ────────────────────────────────── */
  function submitToSheets(data) {
    var url = (typeof WB !== 'undefined') ? WB.sheetsWebhookUrl : '';

    /* Graceful degradation: if URL not configured, resolve silently */
    if (!url || url === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
      console.warn('[WealthBridge] Google Sheets webhook not configured. ' +
        'Add the Apps Script Web App URL to js/config.js → WB.sheetsWebhookUrl');
      return new Promise(function (resolve) { setTimeout(resolve, 600); });
    }

    /*
     * We use no-cors because Apps Script doesn't return CORS headers
     * for simple POST from static pages. The request still reaches
     * the script and is logged to Sheets + triggers email. The opaque
     * response simply means we can't inspect it — that's fine.
     */
    return fetch(url, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
  }

  /* ── Contact Form ─────────────────────────────────────────── */
  function initContactForm() {
    var form       = document.getElementById('wb-contact-form');
    if (!form) return;

    var submitBtn  = document.getElementById('wb-submit-btn');
    var successBox = document.getElementById('wb-form-success');
    var errorBox   = document.getElementById('wb-form-error');

    /* Real-time single-field validation */
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('blur', function () { validateSingleField(el); });
      el.addEventListener('input', function () { clearFieldError(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Hide status messages */
      if (successBox) successBox.style.display = 'none';
      if (errorBox)   errorBox.style.display   = 'none';

      /* Honeypot anti-spam */
      var hp = form.querySelector('#wb-hp');
      if (hp && hp.value) return; /* bot filled the hidden field */

      /* Client-side rate-limit: max 3 submissions per 10 minutes per browser.
         Doesn't stop a determined attacker, but blocks accidental double-clicks
         and unsophisticated bots. Apps Script enforces the real daily cap. */
      try {
        var nowTs   = Date.now();
        var raw     = localStorage.getItem('wb_form_log') || '[]';
        var history = JSON.parse(raw).filter(function (t) { return nowTs - t < 600000; });
        if (history.length >= 3) {
          if (errorBox) {
            errorBox.textContent = 'Too many submissions. Please try again in a few minutes.';
            errorBox.style.display = 'flex';
          }
          return;
        }
        history.push(nowTs);
        localStorage.setItem('wb_form_log', JSON.stringify(history));
      } catch (_) { /* localStorage unavailable — ignore */ }

      /* Collect */
      var data = {
        firstName: trim(getValue('wb-first-name')),
        lastName:  trim(getValue('wb-last-name')),
        email:     trim(getValue('wb-email')),
        phone:     trim(getValue('wb-phone')),
        interest:  getValue('wb-interest'),
        message:   trim(getValue('wb-message')),
        source:    (window.location.pathname.split('/').pop() || 'index.html'),
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        _secret:   (typeof WB !== 'undefined' && WB.formSecret) ? WB.formSecret : ''
      };

      /* Validate */
      var errs = getValidationErrors(data);
      if (errs.length) { showErrors(form, errs); return; }

      /* Submit */
      setLoading(submitBtn, true);
      submitToSheets(data)
        .then(function () {
          if (successBox) {
            successBox.style.display = 'flex';
            successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          form.reset();
          /* Clear any lingering error hints */
          form.querySelectorAll('.wb-field-error').forEach(function (el) {
            clearFieldError(el);
          });
        })
        .catch(function () {
          if (errorBox) errorBox.style.display = 'flex';
        })
        .finally(function () {
          setLoading(submitBtn, false);
        });
    });

    function getValue(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }
  }

  /* ── Init on DOM Ready ────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    injectFloatingWhatsApp();
    initContactForm();
  }

})();
