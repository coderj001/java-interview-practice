function applyAuthoritativeEvent(current, event) {
  if (!current || Number(event.version) >= Number(current.version)) {
    return {
      timerState: event.timerState,
      remainingMs: Math.max(0, Number(event.remainingMs || 0)),
      version: Number(event.version || 0),
      serverTime: Number(event.serverTime || Date.now())
    };
  }
  return current;
}

function renderRemainingMs(snapshot, now) {
  if (!snapshot) return 0;
  if (snapshot.timerState !== "running") return Math.max(0, snapshot.remainingMs);
  const drift = Math.max(0, Number(now || Date.now()) - Number(snapshot.serverTime || 0));
  return Math.max(0, snapshot.remainingMs - drift);
}

module.exports = { applyAuthoritativeEvent, renderRemainingMs };
