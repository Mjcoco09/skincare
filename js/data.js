// ====== CONSTANTS ======
var DAYS       = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var DAYS_SHORT = ['S','M','T','W','T','F','S'];

// ====== AM ROUTINE STEPS ======
// These run every single morning — non-negotiable baseline.
var AM_STEPS = [
  {
    id:     'am-wash',
    label:  'Wash face',
    detail: 'Warm water, gentle circular motion — 30 sec',
    time:   '30s',
    tip:    'Do this right when you start brushing your teeth'
  },
  {
    id:     'am-spf',
    label:  'CeraVe AM SPF',
    detail: 'Pea-sized amount, blend into face and neck',
    time:   '30s',
    tip:    'Let it absorb before putting on a shirt'
  }
];

// ====== PM ROUTINE STEPS ======
// pm-serum is conditional — shown only on serum nights.
var PM_STEPS_BASE = [
  {
    id:     'pm-wash',
    label:  'Wash face',
    detail: 'Warm water, 30 sec — remove the day\'s grime and SPF',
    time:   '30s',
    tip:    'Do this while you\'re brushing your teeth at night'
  }
];

var PM_STEP_SERUM = {
  id:     'pm-serum',
  label:  'TruSkin Serum',
  detail: 'Pea-sized amount — dot on forehead, cheeks, chin, then blend',
  time:   '30s',
  tip:    'Less is more with retinol. Thin layer, avoid eyes.'
};

var PM_STEP_NO_SERUM = {
  id:     'pm-rest',
  label:  'Rest night \u2014 no serum',
  detail: 'Skin needs off-days to recover. Just the wash is enough.',
  time:   null,
  tip:    'Retinol works while you are consistent, not when you overdo it.',
  isRest: true
};

// ====== RETINOL SCHEDULE ======
// Based on science: introduce retinol slowly or you get irritation that makes you quit.
// Week 1-2: 2-3x/week  → days offset 0, 2, 4  (Mon/Wed/Fri equivalent relative to start)
// Week 3-4: 4-5x/week  → days offset 0,1,2,3,5 (skip 1 day mid-week)
// Month 2+: every night
var RETINOL_SCHEDULE = {
  // Keys are week number (1-indexed). Values = array of day-offsets mod 7 that ARE serum nights.
  1: [0, 2, 4],
  2: [0, 2, 4],
  3: [0, 1, 2, 3, 5],
  4: [0, 1, 2, 3, 5],
  // Week 5+ = every night (handled in logic)
};

// ====== PRODUCTS / SUPPLIES ======
var PRODUCTS = [
  {
    id:       'cerave-am',
    name:     'CeraVe AM Moisturizer SPF 30',
    where:    'Target / Amazon',
    price:    '$18',
    usedIn:   'morning',
    usesPerBottle: 180,   // roughly 6 months daily
    note:     'Daily driver — this is the one you CANNOT run out of'
  },
  {
    id:       'truskin-serum',
    name:     'TruSkin Vitamin C + Retinol Serum',
    where:    'Amazon',
    price:    '$22',
    usedIn:   'night',
    usesPerBottle: 90,    // roughly 3 months on nightly use
    note:     'The active ingredient — builds up over weeks, don\'t skip consistently'
  },
  {
    id:       'face-wash',
    name:     'Face Wash (any gentle cleanser)',
    where:    'Drugstore / Target',
    price:    '$8-14',
    usedIn:   'both',
    usesPerBottle: 120,
    note:     'CeraVe Hydrating or Foaming cleanser are great safe picks'
  }
];

// ====== PROGRESS TIMELINE ======
// What to expect — shown in the Progress view to reduce anxiety about "is this working?"
var PROGRESS_MILESTONES = [
  {
    label:    'Weeks 1\u20134',
    emoji:    '\ud83c\udf31',
    headline: 'Build the habit',
    detail:   'Some dryness or flaking is normal \u2014 that\'s retinol doing its job. Don\'t add more products. Just do the two steps every day.',
    positive: false
  },
  {
    label:    'Month 2\u20133',
    emoji:    '\u2728',
    headline: 'Texture starts shifting',
    detail:   'Skin feels smoother, pores look a bit smaller. You might not notice it yet but others will.',
    positive: true
  },
  {
    label:    'Month 3\u20136',
    emoji:    '\ud83d\udcaa',
    headline: 'Visible results',
    detail:   'Fine lines visibly softer. Firmness improvement. SPF is compounding \u2014 protecting you from new damage every single day.',
    positive: true
  },
  {
    label:    'Month 6+',
    emoji:    '\ud83d\udd25',
    headline: 'Long-term protection locked in',
    detail:   'Consistent retinol + SPF is the most evidence-backed anti-aging combo. You\'re ahead of 90% of people.',
    positive: true
  }
];

// ====== HABIT STACK TIPS ======
// Rotated through on the Today view — gentle reminders that reduce friction
var HABIT_TIPS = [
  'Both products live next to your toothbrush \u2014 brush, then skin.',
  'Morning skin takes 75 seconds. You have 75 seconds.',
  'Night routine goes: brush teeth \u2192 wash face \u2192 serum. Same order, every time.',
  'The serum is already working even on nights you barely try.',
  'Consistency \u003e perfection. A lazy version still counts.'
];
