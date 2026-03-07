// ====== CURRENT VIEW ======
var currentView = 'today';

// ====== NAV ======
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(function(v)    { v.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });

  if (view === 'today') {
    document.getElementById('viewToday').classList.add('active');
    document.getElementById('navToday').classList.add('active');
    renderTodayView();

  } else if (view === 'week') {
    document.getElementById('viewWeek').classList.add('active');
    document.getElementById('navWeek').classList.add('active');
    renderWeekView();

  } else if (view === 'supplies') {
    document.getElementById('viewSupplies').classList.add('active');
    document.getElementById('navSupplies').classList.add('active');
    renderSuppliesView();
  }
}

function renderCurrentView() {
  switchView(currentView);
}

// ====== INIT ======
(function init() {
  // Apply saved theme before rendering to avoid flash
  loadTheme();

  // Boot today view
  renderTodayView();

  // Notifications
  initNotifications();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
})();
