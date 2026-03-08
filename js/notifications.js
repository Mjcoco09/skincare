// ====== NOTIFICATIONS ======
// AM nudge at 7:00, PM nudge at 9:30 PM.
// Gentle, ADHD-friendly language — no guilt, just a cue.
// Uses localStorage to avoid re-sending the same notification in the same day.
// iOS note: notifications only work in standalone mode (Add to Home Screen, iOS 16.4+).
//           Always uses registration.showNotification() — new Notification() is broken on iOS.

var SKIN_NOTIF_KEY = 'skinNotifSent';

// ====== WEB PUSH ======
var VAPID_PUBLIC_KEY = 'BCzPDTbThf0_Hfzc5waMtCcAaZ4f3qYR94FD9tAGqTg-WzvYnpndv-2k8UdidwuKglMMajAIAycS4jRB3PwXzCs';

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var raw     = atob(base64);
  var output  = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function subscribeToWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  navigator.serviceWorker.ready.then(function(reg) {
    reg.pushManager.getSubscription().then(function(existing) {
      if (existing) { sendSubscriptionToBackend(existing); return; }
      reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      }).then(function(sub) {
        sendSubscriptionToBackend(sub);
      }).catch(function() {});
    });
  });
}

function sendSubscriptionToBackend(subscription) {
  fetch('https://adhd-push-worker.mjcoco09.workers.dev/subscribe', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ app: 'skincare', subscription: subscription })
  }).catch(function() {});
}

function syncStateToBackend() {
  var key = getTodayKey();
  fetch('https://adhd-push-worker.mjcoco09.workers.dev/state', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      app: 'skincare',
      state: {
        amDone:        isPeriodComplete(key, 'am'),
        pmDone:        isPeriodComplete(key, 'pm'),
        isSerumNight:  isSerumNight(key),
        daysSinceStart: getDaysSinceStart()
      }
    })
  }).catch(function() {});
}

// ---- iOS / standalone detection ----
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

var SKIN_NOTIF_SCHEDULE = [
  // Mon/Wed/Fri wake at 7:30 AM
  {
    id: 'am-mwf', hour: 7, min: 30, days: [1,3,5],
    title: 'Morning skin \u2014 75 seconds',
    body:  function() { return 'Wash face \u2192 CeraVe SPF. Same as brushing your teeth.'; }
  },
  // Tue/Thu wake at 6:30 AM
  {
    id: 'am-tuth', hour: 6, min: 30, days: [2,4],
    title: 'Morning skin \u2014 75 seconds',
    body:  function() { return 'Wash face \u2192 CeraVe SPF. Same as brushing your teeth.'; }
  },
  // Sat/Sun wake at 10:30 AM
  {
    id: 'am-we', hour: 10, min: 30, days: [0,6],
    title: 'Morning skin \u2014 75 seconds',
    body:  function() { return 'Wash face \u2192 CeraVe SPF. Same as brushing your teeth.'; }
  },
  // PM at 10:30 PM every night
  {
    id:    'pm',
    hour:  22,
    min:   30,
    title: function() {
      return isSerumNight(getTodayKey()) ? 'Serum night \ud83c\udf19' : 'Night wash \ud83c\udf19';
    },
    body:  function() {
      return isSerumNight(getTodayKey())
        ? 'Wash face \u2192 TruSkin serum. Couple minutes, then you\'re done.'
        : 'Just wash your face tonight \u2014 rest night, no serum needed.';
    }
  }
];

// ---- Permission helpers ----
function notifPermitted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

function requestNotifPermission(callback) {
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      dismissNotifBanner();
      subscribeToWebPush();
      syncStateToBackend();
      if (callback) callback();
    } else {
      dismissNotifBanner();
    }
  });
}

// ---- Banner ----
function renderNotifBanner() {
  if (!('Notification' in window) && !isIOS()) return;
  if (Notification.permission === 'granted') return;
  if (document.getElementById('notifBanner')) return;

  if (localStorage.getItem('skinNotifDismissed')) return;
  if (document.getElementById('notifBanner')) return;

  var banner       = document.createElement('div');
  banner.id        = 'notifBanner';

  // iOS not in standalone — can't request permission from browser tab
  if (isIOS() && !isStandalone()) {
    banner.className = 'notif-banner notif-banner-ios';
    banner.innerHTML =
      '<div class="notif-banner-body">' +
        '<div class="notif-banner-text">Add to Home Screen for reminders</div>' +
        '<div class="notif-banner-sub">Tap the Share button \u2197\ufe0f then \u201cAdd to Home Screen\u201d \u2014 iOS only supports notifications from installed apps</div>' +
      '</div>' +
      '<button class="notif-dismiss-btn" onclick="dismissNotifBanner()" aria-label="Dismiss">&times;</button>';

  // Permission was denied — direct to Settings
  } else if (Notification.permission === 'denied') {
    banner.className = 'notif-banner notif-banner-warn';
    banner.innerHTML =
      '<div class="notif-banner-body">' +
        '<div class="notif-banner-text">Notifications blocked</div>' +
        '<div class="notif-banner-sub">Go to Settings \u203a Notifications \u203a your browser to re-enable</div>' +
      '</div>' +
      '<button class="notif-dismiss-btn" onclick="dismissNotifBanner()" aria-label="Dismiss">&times;</button>';

  // Default — show enable button
  } else {
    banner.className = 'notif-banner';
    banner.innerHTML =
      '<div class="notif-banner-body">' +
        '<div class="notif-banner-text">Morning &amp; night reminders</div>' +
        '<div class="notif-banner-sub">A nudge at 7 AM and 9:30 PM \u2014 no spam, just two gentle cues</div>' +
      '</div>' +
      '<button class="notif-enable-btn" onclick="requestNotifPermission()">Enable</button>' +
      '<button class="notif-dismiss-btn" onclick="dismissNotifBanner()" aria-label="Dismiss">&times;</button>';
  }

  var header = document.querySelector('.header');
  if (header && header.nextSibling) {
    header.parentNode.insertBefore(banner, header.nextSibling);
  }
}

function dismissNotifBanner() {
  localStorage.setItem('skinNotifDismissed', '1');
  var b = document.getElementById('notifBanner');
  if (b) b.remove();
}

// ---- Scheduling ----
function getSentNotifs() {
  try { return JSON.parse(localStorage.getItem(SKIN_NOTIF_KEY) || '{}'); } catch(e) { return {}; }
}

function markNotifSent(id) {
  var sent             = getSentNotifs();
  sent[getTodayKey() + '-' + id] = true;
  localStorage.setItem(SKIN_NOTIF_KEY, JSON.stringify(sent));
}

function wasNotifSent(id) {
  return !!getSentNotifs()[getTodayKey() + '-' + id];
}

function sendNotif(schedule) {
  if (!notifPermitted())            return;
  if (wasNotifSent(schedule.id))    return;
  // Don't send AM notif if AM already complete
  if ((schedule.id === 'am' || schedule.id.indexOf('am-') === 0) && isPeriodComplete(getTodayKey(), 'am')) return;
  // Don't send PM notif if PM already complete
  if (schedule.id === 'pm' && isPeriodComplete(getTodayKey(), 'pm')) return;

  var title = typeof schedule.title === 'function' ? schedule.title() : schedule.title;
  var body  = typeof schedule.body  === 'function' ? schedule.body()  : schedule.body;

  // Always use service worker registration — new Notification() is broken on iOS
  navigator.serviceWorker.ready.then(function(reg) {
    reg.showNotification(title, {
      body:    body,
      icon:    'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' rx=\'20\' fill=\'%230a0a0f\'/><text x=\'50\' y=\'68\' font-size=\'55\' text-anchor=\'middle\'>🧴</text></svg>',
      tag:     'skin-' + schedule.id,
      silent:  false
    });
  });
  markNotifSent(schedule.id);
}

function checkNotifSchedule() {
  if (!notifPermitted()) return;
  var now = new Date();
  var h   = now.getHours();
  var m   = now.getMinutes();

  SKIN_NOTIF_SCHEDULE.forEach(function(s) {
    if (s.days && s.days.indexOf(now.getDay()) === -1) return; // not scheduled today
    if (h === s.hour && m >= s.min && m < s.min + 30) {
      sendNotif(s);
    }
  });
}

function initNotifications() {
  renderNotifBanner();
  if (Notification.permission === 'granted') {
    subscribeToWebPush();
    syncStateToBackend();
  }
}
