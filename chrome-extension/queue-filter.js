// Sparkle Suite Live Queue - pure party filtering helpers

(function (root) {
  function normalizePartyId(value) {
    return String(value || "").trim();
  }

  function normalizeName(value) {
    return String(value || "").trim();
  }

  function normalizeExcludedPartyIds(excludedPartyIds) {
    var set = {};
    if (!Array.isArray(excludedPartyIds)) return set;
    for (var i = 0; i < excludedPartyIds.length; i++) {
      var partyId = normalizePartyId(excludedPartyIds[i]);
      if (partyId) set[partyId] = true;
    }
    return set;
  }

  function buildVisibleQueue(rows, excludedPartyIds) {
    var excluded = normalizeExcludedPartyIds(excludedPartyIds);
    var names = [];
    if (!Array.isArray(rows)) return names;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || {};
      var partyId = normalizePartyId(row.partyId);
      if (partyId && excluded[partyId]) continue;
      if (row.revealed) continue;

      var name = normalizeName(row.firstName);
      if (name.length < 2) continue;
      names.push(name);
    }

    names.reverse();
    return names;
  }

  function buildPartySummaries(rows) {
    var byPartyId = {};
    var summaries = [];
    if (!Array.isArray(rows)) return summaries;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || {};
      var partyId = normalizePartyId(row.partyId);
      if (!partyId) continue;

      if (!byPartyId[partyId]) {
        byPartyId[partyId] = {
          partyId: partyId,
          orderCount: 0,
          unrevealedCount: 0,
          latestOrderDateMs: null,
          sampleNames: [],
        };
        summaries.push(byPartyId[partyId]);
      }

      var summary = byPartyId[partyId];
      summary.orderCount += 1;
      if (!row.revealed) summary.unrevealedCount += 1;

      var orderDateMs = Number(row.orderDateMs);
      if (Number.isFinite(orderDateMs)) {
        if (summary.latestOrderDateMs === null || orderDateMs > summary.latestOrderDateMs) {
          summary.latestOrderDateMs = orderDateMs;
        }
      }

      var name = normalizeName(row.firstName);
      if (name && summary.sampleNames.length < 3) {
        summary.sampleNames.push(name);
      }
    }

    summaries.sort(function (a, b) {
      var aDate = a.latestOrderDateMs === null ? -Infinity : a.latestOrderDateMs;
      var bDate = b.latestOrderDateMs === null ? -Infinity : b.latestOrderDateMs;
      return bDate - aDate;
    });

    return summaries;
  }

  var api = {
    buildPartySummaries: buildPartySummaries,
    buildVisibleQueue: buildVisibleQueue,
    normalizeExcludedPartyIds: normalizeExcludedPartyIds,
  };

  root.SparkleQueueFilter = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
