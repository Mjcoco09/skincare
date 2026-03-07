// ====== NOTIFICATIONS ======
// AM nudge at 7:00, PM nudge at 9:30 PM.
// Gentle, ADHD-friendly language — no guilt, just a cue.
// Uses localStorage to avoid re-sending the same notification in the same day.

var SKIN_NOTIF_KEY = 'skinNotifSent';

var SKIN_NOTIF_SCHEDULE = [
  {
    id:    'am',
    hour:  7,
    min:   0,
    title: 'Morning skin \u2014 75 seconds',
    body:  function() {
      return 'Wash face \u2192 CeraVe SPF. Same as brushing your teeth.';
    }
  },
  {
    id:    'pm',
    hour:  21,
    min:   30,
    title: isSerumNight(getTodayKey()) ? 'Serum night \ud83c\udf19' : 'Night wash \ud83c\udf19',
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
      if (callback) callback();
    } else {
      dismissNotifBanner();
    }
  });
}

// ---- Banner ----
function renderNotifBanner() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission === 'denied')  return;
  if (localStorage.getItem('skinNotifDismissed')) return;
  if (document.getElementById('notifBanner')) return;

  var banner       = document.createElement('div');
  banner.id        = 'notifBanner';
  banner.className = 'notif-banner';
  banner.innerHTML =
    '<div>' +
      '<div class="notif-banner-text">\ud83d\udd14 Morning & night reminders</div>' +
      '<div class="notif-banner-sub">Get a nudge at 7 AM and 9:30 PM \u2014 no spam, just two gentle cues</div>' +
    '</div>' +
    '<button class="notif-enable-btn" onclick="requestNotifPermission()">Enable</button>' +
    '<button class="notif-dismiss-btn" onclick="dismissNotifBanner()" aria-label="Dismiss">&times;</button>';

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
  if (schedule.id === 'am' && isPeriodComplete(getTodayKey(), 'am')) return;
  // Don't send PM notif if PM already complete
  if (schedule.id === 'pm' && isPeriodComplete(getTodayKey(), 'pm')) return;

  var title = typeof schedule.title === 'function' ? schedule.title() : schedule.title;
  var body  = typeof schedule.body  === 'function' ? schedule.body()  : schedule.body;

  new Notification(title, {
    body:    body,
    icon:    'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><rect width=\'100\' height=\'100\' rx=\'20\' fill=\'%230a0a0f\'/><text x=\'50\' y=\'68\' font-size=\'55\' text-anchor=\'middle\'>🧴</text></svg>',
    tag:     'skin-' + schedule.id,
    silent:  false
  });
  markNotifSent(schedule.id);
}

function checkNotifSchedule() {
  if (!notifPermitted()) return;
  var now = new Date();
  var h   = now.getHours();
  var m   = now.getMinutes();

  SKIN_NOTIF_SCHEDULE.forEach(function(s) {
    if (h === s.hour && m >= s.min && m < s.min + 30) {
      sendNotif(s);
    }
  });
}

function initNotifications() {
  renderNotifBanner();
  checkNotifSchedule();

  // Re-check every 60s while page is visible
  setInterval(function() {
    if (!document.hidden) checkNotifSchedule();
  }, 60000);

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) checkNotifSchedule();
  });
  window.addEventListener('focus', checkNotifSchedule);
}
