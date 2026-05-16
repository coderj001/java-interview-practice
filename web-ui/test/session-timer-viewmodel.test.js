const test = require("node:test");
const assert = require("node:assert/strict");

const { applyAuthoritativeEvent, renderRemainingMs } = require("../src/node/session-timer-viewmodel");

test("local countdown decreases between events", () => {
  const snapshot = {
    timerState: "running",
    remainingMs: 10000,
    version: 2,
    serverTime: 1000
  };

  assert.equal(renderRemainingMs(snapshot, 5000), 6000);
});

test("authoritative newer event resets local snapshot", () => {
  const current = { timerState: "running", remainingMs: 10000, version: 2, serverTime: 1000 };
  const next = { timerState: "paused", remainingMs: 7500, version: 3, serverTime: 6000 };
  const result = applyAuthoritativeEvent(current, next);

  assert.equal(result.timerState, "paused");
  assert.equal(result.remainingMs, 7500);
  assert.equal(result.version, 3);
});

test("stale event is ignored", () => {
  const current = { timerState: "running", remainingMs: 10000, version: 4, serverTime: 1000 };
  const stale = { timerState: "paused", remainingMs: 7000, version: 3, serverTime: 6000 };
  const result = applyAuthoritativeEvent(current, stale);

  assert.equal(result, current);
});
