// Sparkle Suite Live Queue — Popup UI

var setupView = document.getElementById("setup-view");
var activeView = document.getElementById("active-view");
var syncInput = document.getElementById("sync-input");
var setupError = document.getElementById("setup-error");
var saveBtn = document.getElementById("save-btn");
var displayCode = document.getElementById("display-code");
var toggleEnabled = document.getElementById("toggle-enabled");
var statusDot = document.getElementById("status-dot");
var lastSyncTimeEl = document.getElementById("last-sync-time");
var resetLink = document.getElementById("reset-link");

var CODE_PATTERN = /^[A-Z]{3}-\d{4}$/;
var refreshInterval = null;

function showSetup() {
  setupView.classList.remove("hidden");
  activeView.classList.add("hidden");
  syncInput.value = "";
  setupError.textContent = "";
}

function showActive(code) {
  setupView.classList.add("hidden");
  activeView.classList.remove("hidden");
  displayCode.textContent = code;
}

function formatAgo(ts) {
  if (!ts) return "Not yet synced";
  var diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "Just now";
  if (diff < 60) return diff + "s ago";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  return Math.floor(diff / 3600) + "h ago";
}

function updateStatus() {
  chrome.storage.local.get(["lastSyncTime", "lastSyncStatus"], function (data) {
    var ts = data.lastSyncTime;
    var status = data.lastSyncStatus;

    lastSyncTimeEl.textContent = formatAgo(ts);

    statusDot.className = "dot";
    if (!ts || !status) {
      statusDot.classList.add("red");
    } else if (status === "error") {
      statusDot.classList.add("red");
    } else {
      var ageMs = Date.now() - ts;
      if (ageMs < 120000) {
        statusDot.classList.add("green");
      } else if (ageMs < 300000) {
        statusDot.classList.add("yellow");
      } else {
        statusDot.classList.add("red");
      }
    }
  });
}

// Load initial state
chrome.storage.sync.get(["sync_code", "enabled"], function (data) {
  if (data.sync_code) {
    showActive(data.sync_code);
    toggleEnabled.checked = data.enabled !== false;
    updateStatus();
    refreshInterval = setInterval(updateStatus, 10000);
  } else {
    showSetup();
  }
});

// Save button
saveBtn.addEventListener("click", function () {
  var val = syncInput.value.trim().toUpperCase();
  if (!CODE_PATTERN.test(val)) {
    setupError.textContent = "Format: 3 letters, dash, 4 digits (e.g. MHF-7342)";
    return;
  }
  chrome.storage.sync.set({ sync_code: val, enabled: true }, function () {
    showActive(val);
    toggleEnabled.checked = true;
    updateStatus();
    refreshInterval = setInterval(updateStatus, 10000);
  });
});

// Allow Enter key to save
syncInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") saveBtn.click();
});

// Toggle
toggleEnabled.addEventListener("change", function () {
  chrome.storage.sync.set({ enabled: toggleEnabled.checked });
});

// Reset
resetLink.addEventListener("click", function (e) {
  e.preventDefault();
  clearInterval(refreshInterval);
  chrome.storage.sync.remove(["sync_code", "enabled"]);
  chrome.storage.local.remove(["lastSyncTime", "lastSyncStatus"]);
  showSetup();
});
