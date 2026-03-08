// ====== START DATE ======
// Records when the user first opened the app — drives the retinol schedule.
function getStartDate() {
  var stored = localStorage.getItem('skinStartDate');
  if (stored) return new Date(stored);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  localStorage.setItem('skinStartDate', today.toISOString());
  return today;
}

function resetStartDate() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  localStorage.setItem('skinStartDate', today.toISOString());
}

// ====== DATE HELPERS ======
function getDateKey(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function getTodayKey() { return getDateKey(new Date()); }
function getTomorrowKey() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  return getDateKey(d);
}
function getToday()    { return new Date().getDay(); }

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ====== RETINOL SCHEDULE ======
function getDaysSinceStart(targetDate) {
  var start = getStartDate();
  var tgt   = targetDate ? new Date(targetDate) : new Date();
  tgt.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((tgt - start) / 86400000);
}

function getRetinolWeek(daysSince) {
  if (daysSince === undefined) daysSince = getDaysSinceStart();
  return Math.floor(daysSince / 7) + 1; // 1-indexed
}

// Returns true if the given day is a serum night based on the schedule.
function isSerumNight(dateKey) {
  var d       = dateKey ? new Date(dateKey) : new Date();
  var days    = getDaysSinceStart(d);
  var week    = getRetinolWeek(days);
  if (week >= 5) return true; // Month 2+ = every night
  var offsets = RETINOL_SCHEDULE[week] || [0, 2, 4];
  return offsets.indexOf(days % 7) !== -1;
}

// Human-readable label for current schedule
function getRetinolScheduleLabel() {
  var week = getRetinolWeek();
  if (week >= 5) return 'Every night';
  if (week >= 3) return '4\u20135x / week';
  return '2\u20133x / week';
}

function getRetinolWeekLabel() {
  var week = getRetinolWeek();
  if (week >= 5) return 'Month 2+';
  return 'Week ' + week;
}

// ====== STEP COMPLETION ======
function getCompletions(dateKey) {
  var all = JSON.parse(localStorage.getItem('skinCompletions') || '{}');
  return all[dateKey] || {};
}

function setStepDone(dateKey, stepId, isDone) {
  var all  = JSON.parse(localStorage.getItem('skinCompletions') || '{}');
  if (!all[dateKey]) all[dateKey] = {};
  if (isDone) {
    all[dateKey][stepId] = true;
  } else {
    delete all[dateKey][stepId];
    if (Object.keys(all[dateKey]).length === 0) delete all[dateKey];
  }
  localStorage.setItem('skinCompletions', JSON.stringify(all));
}

function toggleStep(dateKey, stepId) {
  var done = getCompletions(dateKey)[stepId] || false;
  setStepDone(dateKey, stepId, !done);
}

function isStepDone(dateKey, stepId) {
  return !!getCompletions(dateKey)[stepId];
}

// A period ('am' or 'pm') is complete when its non-negotiable steps are checked.
// AM: am-wash + am-spf
// PM serum night:  pm-wash + pm-serum
// PM rest night:   pm-wash only (rest step has no checkbox — washing is all that's needed)
function isPeriodComplete(dateKey, period) {
  var c = getCompletions(dateKey);
  if (period === 'am') {
    return !!(c['am-wash'] && c['am-spf']);
  }
  if (period === 'pm') {
    if (!c['pm-wash']) return false;
    var serum = isSerumNight(dateKey);
    if (serum) return !!c['pm-serum'];
    return true; // rest night — washing face is all that's required
  }
  return false;
}

// Day is "counted" toward streak if both non-negotiable periods are complete
function isDayStreakComplete(dateKey) {
  return isPeriodComplete(dateKey, 'am') && isPeriodComplete(dateKey, 'pm');
}

// How many steps in a period are checked (for progress bar)
function countPeriodDone(dateKey, period) {
  var steps = period === 'am' ? AM_STEPS : getPMSteps(dateKey);
  var done  = 0;
  steps.forEach(function(s) {
    if (isStepDone(dateKey, s.id)) done++;
  });
  return done;
}

// Get the correct PM steps for a given date (includes or excludes serum step)
function getPMSteps(dateKey) {
  var base  = PM_STEPS_BASE.slice();
  if (isSerumNight(dateKey)) {
    base.push(PM_STEP_SERUM);
  } else {
    base.push(PM_STEP_NO_SERUM);
  }
  return base;
}

// ====== STREAK ======
function getStreak() {
  var today     = new Date();
  today.setHours(0, 0, 0, 0);
  var streak    = 0;
  var checkDate = new Date(today);

  // If today isn't complete yet, start from yesterday so the streak doesn't
  // drop to 0 just because it's early in the day. Once today is done it grows.
  var todayKey = getDateKey(today);
  if (!isDayStreakComplete(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (var i = 0; i < 365; i++) {
    var key = getDateKey(checkDate);
    if (!isDayStreakComplete(key)) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Then add today if complete
  if (isDayStreakComplete(todayKey)) streak = Math.max(streak, 1);
  return streak;
}

// Returns completion summary for each of the past 7 days (for week view)
function getWeekSummary() {
  var result  = [];
  var now     = new Date();
  var todayKey = getDateKey(now);
  // Zero today to midnight so future comparison is stable
  var todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  // Start from the Sunday of this week
  var sun = new Date(todayMidnight);
  sun.setDate(todayMidnight.getDate() - todayMidnight.getDay());

  for (var i = 0; i < 7; i++) {
    var d   = new Date(sun);
    d.setDate(sun.getDate() + i);
    var key = getDateKey(d);
    result.push({
      date:       d,
      dateKey:    key,
      dayIndex:   i,
      amDone:     isPeriodComplete(key, 'am'),
      pmDone:     isPeriodComplete(key, 'pm'),
      bothDone:   isDayStreakComplete(key),
      isToday:    key === todayKey,
      isFuture:   d > todayMidnight
    });
  }
  return result;
}

// ====== SUPPLIES (running low flags) ======
function getSuppliesState() {
  return JSON.parse(localStorage.getItem('skinSupplies') || '{}');
}

function toggleSupplyLow(productId) {
  var state = getSuppliesState();
  if (state[productId] && state[productId].low) {
    state[productId].low = false;
  } else {
    if (!state[productId]) state[productId] = {};
    state[productId].low = true;
  }
  localStorage.setItem('skinSupplies', JSON.stringify(state));
}

function isSupplyLow(productId) {
  var state = getSuppliesState();
  return !!(state[productId] && state[productId].low);
}

function countLowSupplies() {
  var count = 0;
  PRODUCTS.forEach(function(p) { if (isSupplyLow(p.id)) count++; });
  return count;
}

// ====== THEME ======
function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  localStorage.setItem('skinTheme', isLight ? 'light' : 'dark');
  updateThemeBtn();
}

function updateThemeBtn() {
  var btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = document.body.classList.contains('light') ? '&#9728;' : '&#9790;';
}

function loadTheme() {
  var saved = localStorage.getItem('skinTheme');
  if (saved === 'light') document.body.classList.add('light');
  updateThemeBtn();
}

// ====== RANDOM HABIT TIP ======
function getDailyTip() {
  var d   = new Date();
  var idx = (d.getDate() + d.getMonth()) % HABIT_TIPS.length;
  return HABIT_TIPS[idx];
}
