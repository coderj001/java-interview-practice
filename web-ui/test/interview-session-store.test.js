const test = require("node:test");
const assert = require("node:assert/strict");

const { createInterviewSessionStore } = require("../src/node/interview-session-store");

function sampleChallenges() {
  return [
    { id: "1", title: "Two Sum", details: "Find pairs." },
    { id: "4", title: "Median", details: "Median arrays." }
  ];
}

test("session snapshot includes assigned challenges and pending states", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenges: sampleChallenges()
  });

  assert.deepEqual(session.assignedChallengeIds, ["1", "4"]);
  assert.equal(session.challengeStates.length, 2);
  assert.equal(session.challengeStates[0].state, "pending");
  assert.equal(session.phase, "ready");
});

test("owner can start assigned challenge and non-owner is rejected", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenges: sampleChallenges()
  });

  assert.throws(
    () =>
      store.startAssignedChallenge({
        sessionId: session.sessionId,
        actorId: "candidate",
        challengeId: "1"
      }),
    /only interviewer owner/
  );

  const started = store.startAssignedChallenge({
    sessionId: session.sessionId,
    actorId: "owner",
    challengeId: "1"
  });
  assert.equal(started.challengeStates[0].state, "started");
  assert.equal(started.activeChallengeId, "1");
});

test("timer mutation requires interviewer ownership and version", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenges: sampleChallenges()
  });

  assert.throws(
    () => store.mutateTimer({ sessionId: session.sessionId, actorId: "intruder", action: "start", expectedVersion: 0 }),
    /only interviewer owner/
  );

  store.mutateTimer({ sessionId: session.sessionId, actorId: "owner", action: "start", expectedVersion: 0 });

  try {
    store.mutateTimer({ sessionId: session.sessionId, actorId: "owner", action: "pause", expectedVersion: 0 });
    assert.fail("Expected version conflict");
  } catch (error) {
    assert.equal(error.code, 409);
    assert.equal(error.currentVersion, 1);
  }
});

test("challenge access is locked for interviewee until started", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenges: sampleChallenges()
  });

  assert.throws(
    () =>
      store.challengeForRun({
        sessionId: session.sessionId,
        actorId: "candidate",
        challengeId: "1"
      }),
    /locked/
  );

  store.startAssignedChallenge({ sessionId: session.sessionId, actorId: "owner", challengeId: "1" });
  const visible = store.challengeForRun({ sessionId: session.sessionId, actorId: "candidate", challengeId: "1" });
  assert.equal(visible.id, "1");
});

test("selecting a visible challenge updates active challenge", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenges: sampleChallenges()
  });

  store.startAssignedChallenge({ sessionId: session.sessionId, actorId: "owner", challengeId: "1" });
  store.startAssignedChallenge({ sessionId: session.sessionId, actorId: "owner", challengeId: "4" });

  const selected = store.selectVisibleChallenge({
    sessionId: session.sessionId,
    actorId: "candidate",
    challengeId: "4"
  });

  assert.equal(selected.activeChallengeId, "4");
  assert.equal(selected.challenge.id, "4");
});

test("submissions are interviewer-visible only and can mark challenge complete", () => {
  const store = createInterviewSessionStore();
  const session = store.createSession({
    interviewerId: "owner",
    intervieweeId: "candidate",
    durationMs: 120000,
    challenges: sampleChallenges()
  });

  store.startAssignedChallenge({ sessionId: session.sessionId, actorId: "owner", challengeId: "1" });

  const submission = store.addSubmission({
    sessionId: session.sessionId,
    actorId: "candidate",
    challengeId: "1",
    code: "class Solution {}",
    output: { correctnessPoints: 100 },
    status: "passed"
  });

  assert.equal(submission.status, "passed");
  assert.throws(() => {
    store.listSubmissions({ sessionId: session.sessionId, actorId: "candidate" });
  }, /only interviewer owner/);

  const logs = store.listSubmissions({ sessionId: session.sessionId, actorId: "owner" });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].challengeId, "1");

  const snap = store.snapshot(store.getSession(session.sessionId));
  const state = snap.challengeStates.find((entry) => entry.id === "1");
  assert.equal(state.state, "completed");
});
