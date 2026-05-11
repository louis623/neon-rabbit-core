// Sparkle Suite Live Queue — Popup UI

var setupView = document.getElementById("setup-view");
var activeView = document.getElementById("active-view");
var syncInput = document.getElementById("sync-input");
var setupError = document.getElementById("setup-error");
var saveBtn = document.getElementById("save-btn");
var displayCode = document.getElementById("display-code");
var toggleEnabled = document.getElementById("toggle-enabled");
var statusDot = document.getElementById("status-dot");
var statusText = document.getElementById("status-text");
var resetLink = document.getElementById("reset-link");
var partyFilterList = document.getElementById("party-filter-list");
var partyFilterSummary = document.getElementById("party-filter-summary");

var CODE_PATTERN = /^[A-Z]{3}-\d{4}$/;
var EXCLUDED_PARTY_IDS_STORAGE_KEY = "excluded_party_ids";
var PARTY_SUMMARIES_STORAGE_KEY = "partySummaries";

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

function updateStatus() {
  var isOn = toggleEnabled.checked;
  if (!isOn) {
    statusDot.className = "dot";
    statusText.textContent = "Paused";
    return;
  }
  chrome.storage.local.get(["lastSyncStatus"], function (data) {
    statusDot.className = "dot";
    if (data.lastSyncStatus === "error") {
      statusDot.classList.add("red");
      statusText.textContent = "Error";
    } else {
      statusDot.classList.add("green");
      statusText.textContent = "Connected";
    }
  });
}

function formatPartyMeta(summary) {
  var parts = [];
  parts.push(summary.orderCount + (summary.orderCount === 1 ? " order" : " orders"));
  if (summary.unrevealedCount !== summary.orderCount) {
    parts.push(summary.unrevealedCount + " unrevealed");
  }
  if (Array.isArray(summary.sampleNames) && summary.sampleNames.length > 0) {
    parts.push(summary.sampleNames.join(", "));
  }
  return parts.join(" - ");
}

function renderPartyFilters() {
  chrome.storage.local.get([PARTY_SUMMARIES_STORAGE_KEY], function (localData) {
    chrome.storage.sync.get([EXCLUDED_PARTY_IDS_STORAGE_KEY], function (syncData) {
      var summaries = Array.isArray(localData[PARTY_SUMMARIES_STORAGE_KEY])
        ? localData[PARTY_SUMMARIES_STORAGE_KEY]
        : [];
      var excludedPartyIds = Array.isArray(syncData[EXCLUDED_PARTY_IDS_STORAGE_KEY])
        ? syncData[EXCLUDED_PARTY_IDS_STORAGE_KEY]
        : [];
      var excluded = {};
      for (var i = 0; i < excludedPartyIds.length; i++) {
        excluded[excludedPartyIds[i]] = true;
      }

      partyFilterList.textContent = "";
      if (summaries.length === 0) {
        partyFilterSummary.textContent = "";
        var empty = document.createElement("span");
        empty.className = "party-filter-empty";
        empty.textContent = "Open the Bomb Party orders page to detect parties.";
        partyFilterList.appendChild(empty);
        return;
      }

      var hiddenCount = 0;
      for (var j = 0; j < summaries.length; j++) {
        if (excluded[summaries[j].partyId]) hiddenCount += 1;
        var row = document.createElement("label");
        row.className = "party-filter-option";

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !excluded[summaries[j].partyId];
        checkbox.setAttribute("data-party-id", summaries[j].partyId);

        var text = document.createElement("span");
        text.className = "party-filter-copy";

        var title = document.createElement("span");
        title.className = "party-filter-party";
        title.textContent = summaries[j].partyId;

        var meta = document.createElement("span");
        meta.className = "party-filter-meta";
        meta.textContent = formatPartyMeta(summaries[j]);

        text.appendChild(title);
        text.appendChild(meta);
        row.appendChild(checkbox);
        row.appendChild(text);
        partyFilterList.appendChild(row);
      }

      partyFilterSummary.textContent = (summaries.length - hiddenCount) + " shown / " + hiddenCount + " hidden";
    });
  });
}

function setPartyExcluded(partyId, shouldExclude) {
  chrome.storage.sync.get([EXCLUDED_PARTY_IDS_STORAGE_KEY], function (data) {
    var excludedPartyIds = Array.isArray(data[EXCLUDED_PARTY_IDS_STORAGE_KEY])
      ? data[EXCLUDED_PARTY_IDS_STORAGE_KEY]
      : [];
    var next = [];
    var found = false;

    for (var i = 0; i < excludedPartyIds.length; i++) {
      if (excludedPartyIds[i] === partyId) {
        found = true;
        if (!shouldExclude) continue;
      }
      next.push(excludedPartyIds[i]);
    }

    if (shouldExclude && !found) next.push(partyId);

    var update = {};
    update[EXCLUDED_PARTY_IDS_STORAGE_KEY] = next;
    chrome.storage.sync.set(update);
  });
}

// Load initial state
chrome.storage.sync.get(["sync_code", "enabled"], function (data) {
  if (data.sync_code) {
    showActive(data.sync_code);
    toggleEnabled.checked = data.enabled !== false;
    updateStatus();
    renderPartyFilters();
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
    renderPartyFilters();
  });
});

// Allow Enter key to save
syncInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") saveBtn.click();
});

// Toggle
toggleEnabled.addEventListener("change", function () {
  chrome.storage.sync.set({ enabled: toggleEnabled.checked });
  updateStatus();
});

// React to sync status changes from content script
chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === "local" && changes.lastSyncStatus) {
    updateStatus();
  }
  if (
    (area === "local" && changes[PARTY_SUMMARIES_STORAGE_KEY]) ||
    (area === "sync" && changes[EXCLUDED_PARTY_IDS_STORAGE_KEY])
  ) {
    renderPartyFilters();
  }
});

partyFilterList.addEventListener("change", function (event) {
  var target = event.target;
  if (!target || target.type !== "checkbox") return;
  var partyId = target.getAttribute("data-party-id");
  if (!partyId) return;
  setPartyExcluded(partyId, !target.checked);
});

// Reset
resetLink.addEventListener("click", function (e) {
  e.preventDefault();
  chrome.storage.sync.remove(["sync_code", "enabled", EXCLUDED_PARTY_IDS_STORAGE_KEY]);
  chrome.storage.local.remove(["lastSyncTime", "lastSyncStatus", PARTY_SUMMARIES_STORAGE_KEY]);
  showSetup();
});
