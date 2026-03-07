// ====== STREAK PILL ======
function renderStreakPill(streak) {
  if (streak === 0) {
    return '<div class="streak-pill zero">Start your streak today \u2014 tap a step below</div>';
  }
  var fire   = streak >= 7  ? '\ud83d\udd25\ud83d\udd25' : '\ud83d\udd25';
  var suffix = streak === 1 ? 'day' : 'days';
  return '<div class="streak-pill">' + fire + ' ' + streak + '-' + suffix + ' streak</div>';
}

// ====== SERUM SCHEDULE BADGE ======
function renderSerumBadge(dateKey) {
  var serum     = isSerumNight(dateKey);
  var weekLabel = getRetinolWeekLabel();
  var freqLabel = getRetinolScheduleLabel();

  if (serum) {
    return '<div class="serum-badge serum-on">' +
      '<span class="serum-icon">\u2728</span>' +
      '<div>' +
        '<div class="serum-title">Serum tonight</div>' +
        '<div class="serum-sub">' + weekLabel + ' \u00b7 ' + freqLabel + '</div>' +
      '</div>' +
    '</div>';
  }
  return '<div class="serum-badge serum-off">' +
    '<span class="serum-icon">\ud83c\udf19</span>' +
    '<div>' +
      '<div class="serum-title">Rest night \u2014 no serum</div>' +
      '<div class="serum-sub">' + weekLabel + ' \u00b7 ' + freqLabel + ' \u2014 skin needs the break</div>' +
    '</div>' +
  '</div>';
}

// ====== SINGLE STEP ======
function renderStep(step, dateKey, isLazy, lazyIds) {
  // In lazy mode, skip steps not in the minimal set
  if (isLazy && lazyIds && lazyIds.indexOf(step.id) === -1) return '';
  if (step.isRest) {
    // Rest night placeholder — no checkbox, just info
    return '<div class="step rest-step">' +
      '<div class="step-rest-icon">\ud83c\udf19</div>' +
      '<div class="step-body">' +
        '<div class="step-label">' + step.label + '</div>' +
        (step.detail ? '<div class="step-detail">' + step.detail + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  var done = isStepDone(dateKey, step.id);
  return '<div class="step' + (done ? ' done' : '') + '" onclick="handleStepTap(\'' + dateKey + '\',\'' + step.id + '\')">' +
    '<div class="step-check">' + (done ? '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>' +
    '<div class="step-body">' +
      '<div class="step-label">' + step.label + '</div>' +
      (!done && step.detail ? '<div class="step-detail">' + step.detail + '</div>' : '') +
    '</div>' +
    (step.time ? '<div class="step-time">' + step.time + '</div>' : '') +
  '</div>';
}

// ====== ROUTINE CARD (AM or PM) ======
function renderRoutineCard(period, dateKey) {
  var isAM     = period === 'am';
  var steps    = isAM ? AM_STEPS : getPMSteps(dateKey);
  var lazy     = isLazyMode();
  // Lazy-mode minimal steps: just non-negotiable wash + product
  var lazyIds  = isAM ? ['am-wash', 'am-spf'] : ['pm-wash', 'pm-serum', 'pm-rest'];

  var doneCt   = countPeriodDone(dateKey, period);
  var totalCt  = steps.filter(function(s) { return !s.isRest; }).length;
  if (lazy) totalCt = (isAM ? 2 : steps.filter(function(s) { return !s.isRest && lazyIds.indexOf(s.id) !== -1; }).length);

  var complete  = isPeriodComplete(dateKey, period);
  var pct       = totalCt > 0 ? Math.min(Math.round((doneCt / totalCt) * 100), 100) : 0;

  var title    = isAM ? 'MORNING \u00b7 75 sec' : 'TONIGHT \u00b7 2 min';
  var headerClass = isAM ? 'am' : 'pm';

  // Find a tip to show (first un-done step with a tip)
  var tip = null;
  if (!complete) {
    steps.forEach(function(s) {
      if (!tip && s.tip && !isStepDone(dateKey, s.id)) tip = s.tip;
    });
  }

  var html = '<div class="routine-card ' + headerClass + (complete ? ' complete' : '') + '">';

  // Card header
  html += '<div class="routine-header">' +
    '<div class="routine-title-row">' +
      '<span class="routine-label">' + title + '</span>' +
      (complete ? '<span class="routine-done-badge">\u2713 Done</span>' : '') +
    '</div>' +
    '<div class="routine-bar-wrap">' +
      '<div class="routine-bar" style="width:' + pct + '%"></div>' +
    '</div>' +
  '</div>';

  // Serum badge for PM
  if (!isAM) {
    html += renderSerumBadge(dateKey);
  }

  // Steps list
  html += '<div class="steps-list">';
  steps.forEach(function(s) {
    html += renderStep(s, dateKey, lazy, lazyIds);
  });
  html += '</div>';

  // Habit-stack tip
  if (tip) {
    html += '<div class="routine-tip">\ud83d\udca1 ' + tip + '</div>';
  }

  html += '</div>'; // .routine-card
  return html;
}

// ====== TOMORROW PREVIEW ======
function renderTomorrowPreview() {
  var key      = getTomorrowKey();
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var dayName  = DAYS[tomorrow.getDay()];
  var isSerum  = isSerumNight(key);

  var html = '<div class="tomorrow-card">' +
    '<div class="tomorrow-header">' +
      '<span class="tomorrow-label">Tomorrow \u00b7 ' + dayName + '</span>' +
      (isSerum
        ? '<span class="tomorrow-serum on">\u2728 Serum night</span>'
        : '<span class="tomorrow-serum off">\ud83c\udf19 Rest night</span>') +
    '</div>' +
    '<div class="tomorrow-steps">';

  html += '<div class="tmr-period">Morning</div>';
  AM_STEPS.forEach(function(s) {
    html += '<div class="tmr-step"><span class="tmr-dot"></span>' + s.label + (s.time ? ' <span class="tmr-time">' + s.time + '</span>' : '') + '</div>';
  });

  html += '<div class="tmr-period">Night</div>';
  getPMSteps(key).forEach(function(s) {
    html += '<div class="tmr-step' + (s.isRest ? ' rest' : '') + '"><span class="tmr-dot"></span>' + s.label + (s.time ? ' <span class="tmr-time">' + s.time + '</span>' : '') + '</div>';
  });

  html += '</div></div>';
  return html;
}

// ====== LAZY MODE TOGGLE BUTTON ======
function renderLazyToggle() {
  var lazy = isLazyMode();
  return '<button class="lazy-btn' + (lazy ? ' active' : '') + '" onclick="handleLazyToggle()">' +
    (lazy
      ? '\u26a1 Lazy mode: on \u2014 tap to show all steps'
      : '\ud83d\ude34 Low energy day? Tap for lazy mode') +
  '</button>';
}

// ====== TODAY VIEW ======
function renderTodayView() {
  var key      = getTodayKey();
  var dayIdx   = getToday();
  var streak   = getStreak();
  var tip      = getDailyTip();

  document.getElementById('headerGreeting').textContent = getGreeting();
  document.getElementById('headerDay').textContent      = DAYS[dayIdx];
  document.getElementById('headerPill').textContent     = formatDate(new Date());

  var html = '';
  html += renderStreakPill(streak);

  // Habit-stack reminder card (always visible, small)
  html += '<div class="habit-tip-card">\ud83d\udca1 ' + tip + '</div>';

  html += renderRoutineCard('am', key);
  html += renderRoutineCard('pm', key);
  html += renderLazyToggle();
  html += renderTomorrowPreview();

  document.getElementById('viewToday').innerHTML = html;
}

// ====== WEEK VIEW ======
function renderWeekView() {
  var summary  = getWeekSummary();
  var streak   = getStreak();

  document.getElementById('headerGreeting').textContent = 'THIS WEEK';
  document.getElementById('headerDay').textContent      = 'Streak';
  document.getElementById('headerPill').textContent     = streak + (streak === 1 ? ' day' : ' days');

  // Grid of 7 days — all cells tappable; future = preview, past/today = completion
  var gridHtml = '<div class="week-grid" id="weekGrid">';
  summary.forEach(function(day) {
    var cls = 'week-day-cell';
    if (day.isToday)  cls += ' today';
    if (day.isFuture) cls += ' future';
    if (day.bothDone) cls += ' both-done';

    gridHtml += '<div class="' + cls + '" onclick="selectWeekDay(\'' + day.dateKey + '\', ' + day.dayIndex + ', ' + day.isFuture + ')" data-datekey="' + day.dateKey + '">' +
      '<div class="wk-day-letter">' + DAYS_SHORT[day.dayIndex] + '</div>' +
      '<div class="wk-day-num">'    + day.date.getDate()         + '</div>' +
      '<div class="wk-dots">' +
        '<div class="wk-dot am' + (day.amDone ? ' done' : '') + '" title="Morning">M</div>' +
        '<div class="wk-dot pm' + (day.pmDone ? ' done' : '') + '" title="Night">N</div>' +
      '</div>' +
    '</div>';
  });
  gridHtml += '</div>';

  // Week completion score
  var doneDays = summary.filter(function(d) { return !d.isFuture && d.bothDone; }).length;
  var pastDays = summary.filter(function(d) { return !d.isFuture; }).length;
  var scoreHtml = '<div class="week-score">' +
    '<div class="week-score-label">This week</div>' +
    '<div class="week-score-value">' + doneDays + ' / ' + pastDays + '</div>' +
    '<div class="week-score-sub">days fully complete</div>' +
  '</div>';

  // Per-day breakdown — past/today show completion, future shows serum preview
  var detailHtml = '<div class="week-detail" id="weekDetail">';
  summary.forEach(function(day) {
    if (day.isFuture) {
      var serum = isSerumNight(day.dateKey);
      detailHtml += '<div class="week-detail-row future-row" data-datekey="' + day.dateKey + '">' +
        '<div class="wdr-day">' + DAYS[day.dayIndex].slice(0, 3) + ' <span class="wdr-future-tag">upcoming</span></div>' +
        '<div class="wdr-badges">' +
          '<span class="wdr-badge preview">' + (serum ? '\u2728 Serum' : '\ud83c\udf19 Rest') + '</span>' +
        '</div>' +
      '</div>';
      return;
    }
    var amC = isPeriodComplete(day.dateKey, 'am');
    var pmC = isPeriodComplete(day.dateKey, 'pm');
    detailHtml += '<div class="week-detail-row' + (day.isToday ? ' today' : '') + '" data-datekey="' + day.dateKey + '">' +
      '<div class="wdr-day">' + DAYS[day.dayIndex].slice(0, 3) + (day.isToday ? ' \u2022 today' : '') + '</div>' +
      '<div class="wdr-badges">' +
        '<span class="wdr-badge am' + (amC ? ' done' : '') + '">' + (amC ? '\u2713' : '\u25cb') + ' AM</span>' +
        '<span class="wdr-badge pm' + (pmC ? ' done' : '') + '">' + (pmC ? '\u2713' : '\u25cb') + ' PM</span>' +
      '</div>' +
    '</div>';
  });
  detailHtml += '</div>';

  document.getElementById('viewWeek').innerHTML =
    '<div class="week-view-inner">' +
      gridHtml +
      scoreHtml +
      detailHtml +
    '</div>';
}

// ====== SUPPLIES VIEW ======
function renderSuppliesView() {
  var lowCount = countLowSupplies();

  document.getElementById('headerGreeting').textContent = 'SUPPLIES';
  document.getElementById('headerDay').textContent      = 'Products & Progress';
  document.getElementById('headerPill').textContent     = lowCount > 0 ? lowCount + ' low' : 'All good';

  var html = '';

  // Retinol phase card
  html += renderRetinolPhaseCard();

  // Product cards
  html += '<div class="section-label">Your Products</div>';
  PRODUCTS.forEach(function(p) {
    html += renderProductCard(p);
  });

  // Progress timeline
  html += '<div class="section-label">What to expect</div>';
  html += renderProgressTimeline();

  document.getElementById('viewSupplies').innerHTML = html;
}

// ====== RETINOL PHASE CARD ======
function renderRetinolPhaseCard() {
  var week     = getRetinolWeek();
  var days     = getDaysSinceStart();
  var freqLbl  = getRetinolScheduleLabel();
  var weekLbl  = getRetinolWeekLabel();

  var phaseNote, phaseEmoji;
  if (week <= 2) {
    phaseEmoji = '\ud83c\udf31';
    phaseNote  = 'Go easy this month. 2\u20133 serum nights per week only. Skin is adjusting.';
  } else if (week <= 4) {
    phaseEmoji = '\ud83d\udcc8';
    phaseNote  = 'Good \u2014 stepping up to 4\u20135x/week. If your skin feels fine, you can push to 5x.';
  } else {
    phaseEmoji = '\u2728';
    phaseNote  = 'Month 2+. Every night from here. You did the ramp-up right.';
  }

  return '<div class="phase-card">' +
    '<div class="phase-top">' +
      '<span class="phase-emoji">' + phaseEmoji + '</span>' +
      '<div>' +
        '<div class="phase-label">' + weekLbl + ' \u00b7 Day ' + (days + 1) + '</div>' +
        '<div class="phase-freq">' + freqLbl + ' of serum</div>' +
      '</div>' +
    '</div>' +
    '<div class="phase-note">' + phaseNote + '</div>' +
  '</div>';
}

// ====== PRODUCT CARD ======
function renderProductCard(product) {
  var low = isSupplyLow(product.id);
  return '<div class="product-card' + (low ? ' low' : '') + '">' +
    '<div class="product-top">' +
      '<div class="product-info">' +
        '<div class="product-name">' + product.name + '</div>' +
        '<div class="product-meta">' + product.where + ' \u00b7 ' + product.price + '</div>' +
        '<div class="product-note">' + product.note + '</div>' +
      '</div>' +
      '<button class="low-btn' + (low ? ' active' : '') + '" onclick="handleLowToggle(\'' + product.id + '\')">' +
        (low ? '\u26a0\ufe0f Low' : 'Low?') +
      '</button>' +
    '</div>' +
  '</div>';
}

// ====== PROGRESS TIMELINE ======
function renderProgressTimeline() {
  var days         = getDaysSinceStart();
  var currentMonth = Math.floor(days / 30); // 0-indexed

  var html = '<div class="timeline">';
  PROGRESS_MILESTONES.forEach(function(m, idx) {
    var isActive  = idx === 0 && currentMonth === 0;
    if (idx === 1) isActive = currentMonth >= 1 && currentMonth < 3;
    if (idx === 2) isActive = currentMonth >= 2 && currentMonth < 6;
    if (idx === 3) isActive = currentMonth >= 6;

    var isPast = !isActive && (
      (idx === 0 && currentMonth > 0) ||
      (idx === 1 && currentMonth >= 3) ||
      (idx === 2 && currentMonth >= 6)
    );

    html += '<div class="timeline-item' + (isActive ? ' active' : '') + (isPast ? ' past' : '') + '">' +
      '<div class="tl-dot"></div>' +
      '<div class="tl-body">' +
        '<div class="tl-label">' + m.emoji + ' ' + m.label + '</div>' +
        '<div class="tl-headline">' + m.headline + '</div>' +
        '<div class="tl-detail">' + m.detail + '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  return html;
}

// ====== INTERACTION HANDLERS ======
function handleStepTap(dateKey, stepId) {
  toggleStep(dateKey, stepId);
  // Re-render the relevant period only
  var period = stepId.startsWith('am') ? 'am' : 'pm';
  var card   = document.querySelector('.routine-card.' + period);
  if (card) {
    var replacement = document.createElement('div');
    replacement.innerHTML = renderRoutineCard(period, dateKey);
    card.parentNode.replaceChild(replacement.firstChild, card);
  }
  // Update streak pill
  var pill = document.querySelector('.streak-pill');
  if (pill) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderStreakPill(getStreak());
    pill.parentNode.replaceChild(tempDiv.firstChild, pill);
  }
  // Update supplies low count in header pill if on supplies view
  if (document.getElementById('viewSupplies').classList.contains('active')) {
    document.getElementById('headerPill').textContent = countLowSupplies() > 0 ? countLowSupplies() + ' low' : 'All good';
  }
}

function handleLazyToggle() {
  toggleLazyMode();
  var key = getTodayKey();
  var amCard = document.querySelector('.routine-card.am');
  var pmCard = document.querySelector('.routine-card.pm');
  if (amCard) {
    var r = document.createElement('div');
    r.innerHTML = renderRoutineCard('am', key);
    amCard.parentNode.replaceChild(r.firstChild, amCard);
  }
  if (pmCard) {
    var r2 = document.createElement('div');
    r2.innerHTML = renderRoutineCard('pm', key);
    pmCard.parentNode.replaceChild(r2.firstChild, pmCard);
  }
  var lazyBtn = document.querySelector('.lazy-btn');
  if (lazyBtn) {
    var r3 = document.createElement('div');
    r3.innerHTML = renderLazyToggle();
    lazyBtn.parentNode.replaceChild(r3.firstChild, lazyBtn);
  }
}

function handleLowToggle(productId) {
  toggleSupplyLow(productId);
  renderSuppliesView();
}

// ====== WEEK DAY SELECTOR ======
var _selectedWeekDay = null;

function selectWeekDay(dateKey, dayIndex, isFuture) {
  // Toggle off if same day tapped again
  if (_selectedWeekDay === dateKey) {
    _selectedWeekDay = null;
    renderWeekDayPanel(null, null, false);
    // De-highlight grid cell
    document.querySelectorAll('.week-day-cell').forEach(function(c) {
      c.classList.remove('selected');
    });
    return;
  }
  _selectedWeekDay = dateKey;

  // Highlight tapped cell
  document.querySelectorAll('.week-day-cell').forEach(function(c) {
    c.classList.toggle('selected', c.dataset.datekey === dateKey);
  });

  renderWeekDayPanel(dateKey, dayIndex, isFuture);
}

function renderWeekDayPanel(dateKey, dayIndex, isFuture) {
  // Remove any existing panel
  var old = document.getElementById('weekDayPanel');
  if (old) old.remove();
  if (!dateKey) return;

  var panel = document.createElement('div');
  panel.id        = 'weekDayPanel';
  panel.className = 'week-day-panel' + (isFuture ? ' preview' : '');

  var d       = new Date(dateKey);
  var dayName = DAYS[dayIndex];
  var isSerum = isSerumNight(dateKey);

  if (isFuture) {
    // Preview: show what's scheduled
    var amSteps = AM_STEPS;
    var pmSteps = getPMSteps(dateKey);
    var html    =
      '<div class="wdp-header">' +
        '<span class="wdp-day">' + dayName + ' \u00b7 ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</span>' +
        '<span class="wdp-tag preview">Preview</span>' +
      '</div>' +
      '<div class="wdp-serum ' + (isSerum ? 'on' : 'off') + '">' +
        (isSerum ? '\u2728 Serum night' : '\ud83c\udf19 Rest night \u2014 no serum') +
      '</div>' +
      '<div class="wdp-section">Morning \u00b7 75 sec</div>' +
      '<div class="wdp-steps">';
    amSteps.forEach(function(s) {
      html += '<div class="wdp-step"><span class="wdp-dot"></span>' + s.label + (s.time ? ' <span class="wdp-time">' + s.time + '</span>' : '') + '</div>';
    });
    html += '</div><div class="wdp-section">Night</div><div class="wdp-steps">';
    pmSteps.forEach(function(s) {
      html += '<div class="wdp-step' + (s.isRest ? ' rest' : '') + '"><span class="wdp-dot"></span>' + s.label + (s.time ? ' <span class="wdp-time">' + s.time + '</span>' : '') + '</div>';
    });
    html += '</div>';
    panel.innerHTML = html;

  } else {
    // Past or today: show completion status
    var amC  = isPeriodComplete(dateKey, 'am');
    var pmC  = isPeriodComplete(dateKey, 'pm');
    var html =
      '<div class="wdp-header">' +
        '<span class="wdp-day">' + dayName + '</span>' +
        '<span class="wdp-tag ' + (amC && pmC ? 'done' : 'partial') + '">' + (amC && pmC ? '\u2713 Complete' : 'Partial') + '</span>' +
      '</div>' +
      '<div class="wdp-row"><span class="wdp-period am">Morning</span><span class="wdp-status ' + (amC ? 'done' : '') + '">' + (amC ? '\u2713 Done' : '\u25cb Not done') + '</span></div>' +
      '<div class="wdp-row"><span class="wdp-period pm">Night</span>' +
        '<span class="wdp-status ' + (pmC ? 'done' : '') + '">' + (pmC ? '\u2713 Done' : '\u25cb Not done') + '</span>' +
        '<span class="wdp-serum-inline ' + (isSerum ? 'on' : 'off') + '">' + (isSerum ? '\u2728 serum' : '\ud83c\udf19 rest') + '</span>' +
      '</div>';
    panel.innerHTML = html;
  }

  // Insert panel after the detail list
  var detail = document.getElementById('weekDetail');
  if (detail) detail.parentNode.insertBefore(panel, detail.nextSibling);
}
