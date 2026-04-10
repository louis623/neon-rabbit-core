// Sparkle Suite Live Queue — Service Worker
// Fires a 60-second alarm to trigger content script sync

chrome.alarms.create("sparkle-sync", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== "sparkle-sync") return;
  chrome.tabs.query(
    { url: "https://myoffice.bombparty.com/live-party-orders*" },
    function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, { action: "trigger-sync" }, function () {
          void chrome.runtime.lastError; // silently consume
        });
      }
    }
  );
});
