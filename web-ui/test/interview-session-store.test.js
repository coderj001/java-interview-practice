const test = require("node:test");
const assert = require("node:assert/strict");

const { createInterviewSessionStore } = require("../src/node/interview-session-store");

test("owner can mutate timer and event payload includes required fields", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "1", title: "Two Sum", details: "Find pairs." }
  });

  let observedEvent = null;
  const unsubscribe = store.subscribe(session.sessionId, (event) => {
    observedEvent = event;
  });

  const started = store.mutateTimer({
    sessionId: session.sessionId,
    actorId: "owner",
    action: "start",
    expectedVersion: 0
  });

  unsubscribe();

  assert.equal(started.timerState, "running");
  assert.equal(started.version, 1);
  assert.ok(typeof started.serverTime === "number");
  assert.equal(typeof started.remainingMs, "number");
  assert.equal(typeof started.totalBudgetMs, "number");
  assert.equal(typeof started.elapsedMs, "number");
  assert.equal(observedEvent.sessionId, session.sessionId);
  assert.equal(observedEvent.version, 1);
  assert.equal(observedEvent.challenge.id, "1");
  assert.equal(observedEvent.challenge.title, "Two Sum");
  assert.equal(observedEvent.challenge.details, "Find pairs.");
});

test("non-owner mutation is rejected", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "1", title: "Two Sum", details: "Find pairs." }
  });

  assert.throws(
    () => store.mutateTimer({ sessionId: session.sessionId, actorId: "intruder", action: "start", expectedVersion: 0 }),
    /only interviewer owner/
  );
});

test("stale expected version is rejected with conflict metadata", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "1", title: "Two Sum", details: "Find pairs." }
  });

  store.mutateTimer({ sessionId: session.sessionId, actorId: "owner", action: "start", expectedVersion: 0 });

  try {
    store.mutateTimer({ sessionId: session.sessionId, actorId: "owner", action: "pause", expectedVersion: 0 });
    assert.fail("Expected version conflict");
  } catch (error) {
    assert.equal(error.code, 409);
    assert.equal(error.currentVersion, 1);
  }
});

test("session snapshot includes assigned challenge fields", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "24", title: "Longest Substring", details: "Return max length." }
  });

  assert.equal(session.challenge.id, "24");
  assert.equal(session.challenge.title, "Longest Substring");
  assert.equal(session.challenge.details, "Return max length.");
  assert.equal(session.phase, "ready");
  assert.equal(session.totalBudgetMs, 120000);
});

test("challenge cannot be reassigned after session starts", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "1", title: "Two Sum", details: "Find pairs." }
  });

  store.mutateTimer({ sessionId: session.sessionId, actorId: "owner", action: "start", expectedVersion: 0 });
  assert.throws(
    () =>
      store.assignChallenge({
        sessionId: session.sessionId,
        actorId: "owner",
        challenge: { id: "2", title: "Other", details: "Other challenge" }
      }),
    /cannot be reassigned/
  );
});

test("timer adjust updates total budget and progress fields", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "1", title: "Two Sum", details: "Find pairs." }
  });

  const adjusted = store.mutateTimer({
    sessionId: session.sessionId,
    actorId: "owner",
    action: "adjust",
    expectedVersion: 0,
    deltaMs: 300000
  });

  assert.equal(adjusted.totalBudgetMs, 420000);
  assert.equal(adjusted.remainingMs, 420000);
  assert.equal(adjusted.progressPct, 0);
});

test("submission logs are interviewer-only and include immutable snapshots", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenge: { id: "1", title: "Two Sum", details: "Find pairs." }
  });

  const submission = store.addSubmission({
    sessionId: session.sessionId,
    actorId: "candidate",
    challengeId: "1",
    code: "class Solution {}",
    output: { correctnessPoints: 50 },
    status: "failed"
  });

  assert.equal(submission.status, "failed");
  assert.throws(() => {
    store.listSubmissions({ sessionId: session.sessionId, actorId: "candidate" });
  }, /only interviewer owner/);

  const logs = store.listSubmissions({ sessionId: session.sessionId, actorId: "owner" });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].code, "class Solution {}");
});
