(function (root) {
  const MAX_AGE_MS = 60 * 60 * 1000;
  function merge(current, next) {
    if (!next || !['live', 'empty', 'delayed', 'offline'].includes(next.liveQueueState) ||
        !Array.isArray(next.liveQueueEntries) || next.liveQueueEntries.length > 200 ||
        !next.liveQueueEntries.every((entry) => entry && typeof entry.name === 'string' && Number.isFinite(entry.position)) ||
        !Number.isFinite(Date.parse(next.liveQueueLastUpdated))) return current;
    if (Date.parse(next.liveQueueLastUpdated) < Date.parse(current?.liveQueueLastUpdated)) return current;
    return next;
  }
  function unavailable(current, now = Date.now()) {
    const retain = Number.isFinite(Date.parse(current?.liveQueueLastUpdated)) && now - Date.parse(current.liveQueueLastUpdated) <= MAX_AGE_MS;
    return {
      ...current,
      liveQueueState: retain ? 'delayed' : 'offline',
      liveQueueEntries: retain ? (current.liveQueueEntries || []).map((entry) => ({ ...entry, label: 'Position at last update', highlight: false })) : [],
      liveQueueSummary: retain ? 'Connection delayed. Showing the last received lineup; retrying automatically.' : 'Live Lineup is waiting for a recent update. Retrying automatically.',
    };
  }
  function start({ url, initial, onUpdate }) {
    let current = initial, stopped = false, timer, controller, busy = false;
    async function poll() {
      if (stopped || busy) return;
      clearTimeout(timer);
      if (document.visibilityState === 'hidden') { timer = setTimeout(poll, 30000); return; }
      busy = true;
      controller = new AbortController();
      const deadline = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Lineup unavailable');
        const next = await response.json();
        const merged = merge(current, next);
        if (merged === current && next !== current) throw new Error('Lineup response not current');
        current = merged;
      } catch {
        current = unavailable(current);
      } finally {
        clearTimeout(deadline);
        busy = false;
        if (!stopped) { onUpdate(current); timer = setTimeout(poll, 30000); }
      }
    }
    function resume() { if (document.visibilityState !== 'hidden') void poll(); }
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    void poll();
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); document.removeEventListener('visibilitychange', resume); window.removeEventListener('online', resume); };
  }
  root.SparkleLiveLineup = { merge, unavailable, start };
})(typeof window === 'undefined' ? globalThis : window);
