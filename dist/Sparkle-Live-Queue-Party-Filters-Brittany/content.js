// Sparkle Suite Live Queue - Content Script (read-only DOM scraper)
// Rules: ZERO page refreshes, ZERO DOM writes, ZERO alerts/popups

const EDGE_FUNCTION_URL =
  "https://bqhzfkgkjyuhlsozpylf.supabase.co/functions/v1/live-queue-sync";
const SYNC_KEY = "K7mX9pQrN2vLsT4wHjBdCeF8aYuZgR6n";

const LOG = "[SparkleSync]";
const DEBOUNCE_MS = 3000;
const FETCH_TIMEOUT_MS = 20000;
const TABLE_WAIT_TIMEOUT_MS = 5000;
const TABLE_POLL_MS = 2000;
const PARTY_SUMMARIES_STORAGE_KEY = "partySummaries";
const EXCLUDED_PARTY_IDS_STORAGE_KEY = "excluded_party_ids";

// Cached state
let cachedTable = null;
let cachedTbody = null;
let firstNameIdx = -1;
let revealedIdx = -1;
let partyIdIdx = -1;
let orderDateIdx = -1;

let lastQueueHash = "";
let isSyncing = false;
let pendingSyncAfterCurrent = false;
let pendingSyncForce = false;
let authFailed = false;
let observer = null;
let debounceTimer = null;
let bodyObserver = null;
let pollTimer = null;

// Settings (cached from storage.sync, updated via onChanged)
let syncCode = "";
let enabled = true;
let excludedPartyIds = [];

// Helpers
function hashQueue(queue) {
  return JSON.stringify(queue);
}

function readCellText(cells, index) {
  if (index < 0 || cells.length <= index) return "";
  return cells[index].textContent.trim();
}

// Table discovery
function findTargetTable() {
  return document.getElementById("party-order-table");
}

function findColumnIndices(table) {
  var thead = table.querySelector("thead");
  if (!thead) return false;
  var ths = thead.querySelectorAll("th");
  firstNameIdx = -1;
  revealedIdx = -1;
  partyIdIdx = -1;
  orderDateIdx = -1;
  for (var i = 0; i < ths.length; i++) {
    var sortBy = ths[i].getAttribute("data-sort-by");
    if (sortBy === "FirstName") firstNameIdx = i;
    else if (sortBy === "IsRevealed") revealedIdx = i;
    else if (sortBy === "PartyID") partyIdIdx = i;
    else if (sortBy === "OrderDate") orderDateIdx = i;
  }
  return firstNameIdx !== -1 && revealedIdx !== -1;
}

// Scraper
function parseOrderRows() {
  // Re-validate DOM attachment
  if (!cachedTbody || !cachedTbody.isConnected) {
    cachedTable = findTargetTable();
    if (!cachedTable) return null;
    if (!findColumnIndices(cachedTable)) return null;
    cachedTbody = cachedTable.querySelector("tbody");
    if (observer) observer.disconnect();
    startObserver();
  }

  // Table present but tbody absent - valid empty state
  if (!cachedTbody) return [];

  var rows = cachedTbody.querySelectorAll("tr.product.product-row");
  var orderRows = [];

  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll("td");
    if (cells.length <= firstNameIdx || cells.length <= revealedIdx) continue;

    // Check revealed via checkbox
    var checkbox = cells[revealedIdx].querySelector('input[type="checkbox"]');
    if (!checkbox) continue;

    var orderDateMs = null;
    if (orderDateIdx !== -1 && cells.length > orderDateIdx) {
      var rawOrderDateMs = cells[orderDateIdx].getAttribute("data-order-utc-ms");
      if (rawOrderDateMs) orderDateMs = Number(rawOrderDateMs);
    }

    orderRows.push({
      firstName: readCellText(cells, firstNameIdx),
      partyId: rows[i].getAttribute("data-partyid") || readCellText(cells, partyIdIdx),
      orderId: rows[i].getAttribute("data-orderid") || readCellText(cells, 0),
      orderDateMs: orderDateMs,
      revealed: checkbox.checked,
    });
  }

  return orderRows;
}

function publishPartySummaries(orderRows) {
  var payload = {};
  payload[PARTY_SUMMARIES_STORAGE_KEY] = SparkleQueueFilter.buildPartySummaries(orderRows);
  chrome.storage.local.set(payload);
}

function scrapeQueue() {
  var orderRows = parseOrderRows();
  if (orderRows === null) return null;
  publishPartySummaries(orderRows);
  return SparkleQueueFilter.buildVisibleQueue(orderRows, excludedPartyIds);
}

// Push to edge function
function pushQueue(queue, force) {
  if (isSyncing) {
    pendingSyncAfterCurrent = true;
    pendingSyncForce = pendingSyncForce || force === true;
    return;
  }
  if (!enabled || !syncCode) return;
  if (authFailed) return;

  var qHash = hashQueue(queue);
  if (!force && qHash === lastQueueHash) return;

  isSyncing = true;

  var controller = new AbortController();
  var timeoutId = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);

  fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-key": SYNC_KEY,
    },
    body: JSON.stringify({
      sync_code: syncCode,
      queue: queue,
      timestamp: new Date().toISOString(),
    }),
    signal: controller.signal,
  })
    .then(function (response) {
      clearTimeout(timeoutId);
      if (response.ok) {
        lastQueueHash = qHash;
        chrome.storage.local.set({
          lastSyncTime: Date.now(),
          lastSyncStatus: "ok",
        });
        console.log(LOG, "Queue pushed:", queue.length, "items");
      } else if (response.status === 401) {
        authFailed = true;
        chrome.storage.local.set({ lastSyncStatus: "error" });
        console.log(LOG, "Auth failed (401) - syncing paused");
      } else {
        chrome.storage.local.set({ lastSyncStatus: "error" });
        console.log(LOG, "Server error:", response.status);
      }
    })
    .catch(function (err) {
      clearTimeout(timeoutId);
      chrome.storage.local.set({ lastSyncStatus: "error" });
      if (err.name === "AbortError") {
        console.log(LOG, "Request timed out");
      } else {
        console.log(LOG, "Network error:", err.message);
      }
    })
    .finally(function () {
      isSyncing = false;
      if (pendingSyncAfterCurrent) {
        var shouldForce = pendingSyncForce;
        pendingSyncAfterCurrent = false;
        pendingSyncForce = false;
        syncIfNeeded(shouldForce);
      }
    });
}

// Sync orchestrator
function syncIfNeeded(force) {
  try {
    var queue = scrapeQueue();
    if (queue === null) return;
    pushQueue(queue, force === true);
  } catch (err) {
    console.log(LOG, "Sync error:", err.message);
  }
}

// MutationObserver (table rows)
function startObserver() {
  var target = cachedTbody || cachedTable;
  if (!target) return;
  observer = new MutationObserver(function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(syncIfNeeded, DEBOUNCE_MS);
  });
  observer.observe(target, { childList: true, subtree: !cachedTbody, attributes: true, attributeFilter: ["checked"] });
}

// Table appearance detection
function onTableFound(table) {
  // Stop watching for the table
  if (bodyObserver) { bodyObserver.disconnect(); bodyObserver = null; }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

  cachedTable = table;
  if (!findColumnIndices(cachedTable)) {
    console.log(LOG, "Table found but required columns (FirstName/IsRevealed) missing");
    return;
  }
  cachedTbody = cachedTable.querySelector("tbody");
  console.log(LOG, "Table found. Column indices - firstName:", firstNameIdx, "revealed:", revealedIdx, "partyId:", partyIdIdx);
  startObserver();
  syncIfNeeded();
}

function startTableWatcher() {
  // Primary: MutationObserver on document.body
  var timedOut = false;

  bodyObserver = new MutationObserver(function () {
    if (timedOut) return;
    var table = findTargetTable();
    if (table) {
      timedOut = true; // prevent double-trigger
      onTableFound(table);
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  // Fallback: if not detected within 5s, switch to 2s polling
  setTimeout(function () {
    if (cachedTable) return; // already found
    timedOut = true;
    if (bodyObserver) { bodyObserver.disconnect(); bodyObserver = null; }
    console.log(LOG, "MutationObserver timed out - falling back to 2s polling");

    pollTimer = setInterval(function () {
      var table = findTargetTable();
      if (table) {
        onTableFound(table);
      }
    }, TABLE_POLL_MS);
  }, TABLE_WAIT_TIMEOUT_MS);
}

// Init
function startScraping() {
  // Check if table is already in the DOM (e.g. fast load or cached page)
  var existing = findTargetTable();
  if (existing) {
    onTableFound(existing);
  } else {
    startTableWatcher();
  }
}

function init() {
  chrome.storage.sync.get(["sync_code", "enabled", EXCLUDED_PARTY_IDS_STORAGE_KEY], function (data) {
    syncCode = data.sync_code || "";
    enabled = data.enabled !== false;
    excludedPartyIds = Array.isArray(data[EXCLUDED_PARTY_IDS_STORAGE_KEY])
      ? data[EXCLUDED_PARTY_IDS_STORAGE_KEY]
      : [];
    startScraping();
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "sync") {
      if (changes.sync_code) syncCode = changes.sync_code.newValue || "";
      if (changes.enabled !== undefined) {
        enabled = changes.enabled.newValue !== false;
        if (enabled) {
          authFailed = false;
          syncIfNeeded(true);
        }
      }
      if (changes[EXCLUDED_PARTY_IDS_STORAGE_KEY]) {
        excludedPartyIds = Array.isArray(changes[EXCLUDED_PARTY_IDS_STORAGE_KEY].newValue)
          ? changes[EXCLUDED_PARTY_IDS_STORAGE_KEY].newValue
          : [];
        syncIfNeeded(true);
      }
    }
  });

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === "trigger-sync") {
      syncIfNeeded();
    }
  });

}

// Entry point
init();
