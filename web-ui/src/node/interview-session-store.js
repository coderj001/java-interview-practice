const { EventEmitter } = require("node:events");
const crypto = require("node:crypto");

function createInterviewSessionStore() {
  const sessions = new Map();

  function createSession({ interviewerId, intervieweeId, durationMs, challenges }) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const safeDurationMs = Math.max(0, Number(durationMs || 0) || 0);
    const assignedChallenges = normalizeChallenges(challenges || []);
    const activeChallengeId = assignedChallenges.find((entry) => entry.state === "started")?.id || "";
    const session = {
      id,
      interviewerId: String(interviewerId || "interviewer"),
      intervieweeId: String(intervieweeId || "interviewee"),
      assignedChallenges,
      activeChallengeId,
      phase: assignedChallenges.length ? "ready" : "draft",
      timer: {
        state: "idle",
        remainingMs: safeDurationMs,
        initialDurationMs: safeDurationMs,
        totalBudgetMs: safeDurationMs,
        version: 0,
        lastUpdatedAt: now,
        runningSince: null
      },
      submissions: [],
      events: new EventEmitter()
    };
    sessions.set(id, session);
    return snapshot(session);
  }

  function getSession(id) {
    return sessions.get(String(id || "")) || null;
  }

  function snapshot(session) {
    return snapshotForRole(session, "interviewer");
  }

  function snapshotForRole(session, role) {
    const now = Date.now();
    const timer = materializeTimer(session.timer, now);
    const elapsedMs = Math.max(0, timer.totalBudgetMs - timer.remainingMs);
    const challengeStates = session.assignedChallenges.map((entry) => ({
      id: entry.id,
      title: entry.title,
      state: entry.state
    }));
    const active = session.assignedChallenges.find((entry) => entry.id === session.activeChallengeId) || null;
    const isInterviewer = String(role || "") === "interviewer";
    const challenge = !active
      ? null
      : isInterviewer || active.state === "started" || active.state === "completed"
      ? { id: active.id, title: active.title, details: active.details, starterCode: active.starterCode }
      : { id: active.id, title: active.title, locked: true };
    return {
      sessionId: session.id,
      interviewerId: session.interviewerId,
      intervieweeId: session.intervieweeId,
      phase: session.phase,
      activeChallengeId: session.activeChallengeId,
      assignedChallengeIds: session.assignedChallenges.map((entry) => entry.id),
      challengeStates,
      challenge,
      timerState: timer.state,
      remainingMs: timer.remainingMs,
      elapsedMs,
      totalBudgetMs: timer.totalBudgetMs,
      progressPct: timer.totalBudgetMs <= 0 ? 100 : Math.min(100, Math.round((elapsedMs / timer.totalBudgetMs) * 100)),
      version: timer.version,
      serverTime: now,
      submissionCount: session.submissions.length,
      latestSubmissionStatus: session.submissions.length
        ? session.submissions[session.submissions.length - 1].status
        : null
    };
  }

  function assertOwner(session, actorId) {
    if (String(actorId || "") !== session.interviewerId) {
      const error = new Error("Forbidden: only interviewer owner can mutate timer");
      error.code = 403;
      throw error;
    }
  }

  function assertExpectedVersion(session, expectedVersion) {
    const timer = materializeTimer(session.timer, Date.now());
    if (Number(expectedVersion) !== timer.version) {
      const error = new Error("Version conflict");
      error.code = 409;
      error.currentVersion = timer.version;
      throw error;
    }
  }

  function mutateTimer({ sessionId, actorId, action, expectedVersion, deltaMs }) {
    const session = getSession(sessionId);
    if (!session) {
      const error = new Error(`Unknown session: ${sessionId}`);
      error.code = 404;
      throw error;
    }

    assertOwner(session, actorId);
    assertExpectedVersion(session, expectedVersion);

    const now = Date.now();
    const timer = materializeTimer(session.timer, now);

    if (action === "start") {
      if (!session.assignedChallenges.length) {
        const error = new Error("At least one challenge must be assigned before start");
        error.code = 400;
        throw error;
      }
      timer.state = "running";
      timer.runningSince = now;
      session.phase = "running";
    } else if (action === "pause") {
      timer.state = "paused";
      timer.runningSince = null;
      session.phase = "paused";
    } else if (action === "resume") {
      if (timer.remainingMs > 0) {
        timer.state = "running";
        timer.runningSince = now;
        session.phase = "running";
      }
    } else if (action === "adjust") {
      const delta = Number(deltaMs || 0);
      timer.remainingMs = Math.max(0, timer.remainingMs + delta);
      timer.totalBudgetMs = Math.max(0, timer.totalBudgetMs + delta);
      if (timer.remainingMs === 0) {
        timer.state = "ended";
        timer.runningSince = null;
        session.phase = "ended";
      }
    } else if (action === "end") {
      timer.state = "ended";
      timer.remainingMs = 0;
      timer.runningSince = null;
      session.phase = "ended";
    } else {
      const error = new Error(`Unsupported action: ${action}`);
      error.code = 400;
      throw error;
    }

    timer.version += 1;
    timer.lastUpdatedAt = now;

    session.timer = timer;
    const payload = snapshot(session);
    session.events.emit("timer", payload);
    return payload;
  }

  function materializeTimer(timer, now) {
    const next = { ...timer };
    if (next.state === "running" && typeof next.runningSince === "number") {
      const elapsed = Math.max(0, now - next.runningSince);
      const remaining = Math.max(0, next.remainingMs - elapsed);
      next.remainingMs = remaining;
      next.runningSince = now;
      if (remaining === 0) {
        next.state = "ended";
        next.runningSince = null;
      }
    }
    return next;
  }

  function assignChallenges({ sessionId, actorId, challenges }) {
    const session = getSession(sessionId);
    if (!session) {
      const error = new Error(`Unknown session: ${sessionId}`);
      error.code = 404;
      throw error;
    }
    assertOwner(session, actorId);
    if (session.phase === "running" || session.phase === "paused" || session.phase === "ended") {
      const error = new Error("Challenges cannot be reassigned after session starts");
      error.code = 400;
      throw error;
    }
    const next = normalizeChallenges(challenges);
    if (!next.length) {
      const error = new Error("At least one challenge must be assigned");
      error.code = 400;
      throw error;
    }
    session.assignedChallenges = next;
    session.activeChallengeId = next[0].id;
    session.phase = "ready";
    const payload = snapshot(session);
    session.events.emit("timer", payload);
    return payload;
  }

  function startAssignedChallenge({ sessionId, actorId, challengeId }) {
    const session = getSession(sessionId);
    if (!session) {
      const error = new Error(`Unknown session: ${sessionId}`);
      error.code = 404;
      throw error;
    }
    assertOwner(session, actorId);
    const targetId = String(challengeId || "");
    const index = session.assignedChallenges.findIndex((entry) => entry.id === targetId);
    if (index < 0) {
      const error = new Error(`Challenge is not assigned: ${targetId}`);
      error.code = 400;
      throw error;
    }
    session.assignedChallenges = session.assignedChallenges.map((entry) =>
      entry.id === targetId && entry.state === "pending" ? { ...entry, state: "started" } : entry
    );
    session.activeChallengeId = targetId;
    if (session.phase === "draft") session.phase = "ready";
    const payload = snapshot(session);
    session.events.emit("timer", payload);
    return payload;
  }

  function challengeForRun({ sessionId, actorId, challengeId }) {
    const session = getSession(sessionId);
    if (!session) {
      const error = new Error(`Unknown session: ${sessionId}`);
      error.code = 404;
      throw error;
    }
    const requestedId = String(challengeId || "");
    const entry = session.assignedChallenges.find((item) => item.id === requestedId);
    if (!entry) {
      const error = new Error(`Challenge is not assigned: ${requestedId}`);
      error.code = 400;
      throw error;
    }
    const requester = String(actorId || "");
    const isInterviewer = requester === session.interviewerId;
    if (!isInterviewer && entry.state !== "started" && entry.state !== "completed") {
      const error = new Error("Challenge is locked until interviewer starts it");
      error.code = 423;
      error.payload = {
        locked: true,
        challengeId: requestedId,
        message: "Waiting for interviewer to start this challenge"
      };
      throw error;
    }
    return entry;
  }

  function selectVisibleChallenge({ sessionId, actorId, challengeId }) {
    const entry = challengeForRun({ sessionId, actorId, challengeId });
    const session = getSession(sessionId);
    session.activeChallengeId = entry.id;
    const payload = snapshot(session);
    session.events.emit("timer", payload);
    return payload;
  }

  function addSubmission({ sessionId, actorId, challengeId, code, output, status }) {
    const session = getSession(sessionId);
    if (!session) {
      const error = new Error(`Unknown session: ${sessionId}`);
      error.code = 404;
      throw error;
    }
    if (String(actorId || "") !== session.intervieweeId) {
      const error = new Error("Forbidden: only interviewee can submit");
      error.code = 403;
      throw error;
    }
    const challenge = challengeForRun({ sessionId, actorId, challengeId });
    const entry = Object.freeze({
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      challengeId: challenge.id,
      code: String(code || ""),
      output: output || {},
      status: String(status || "unknown")
    });
    session.submissions.push(entry);
    session.assignedChallenges = session.assignedChallenges.map((item) =>
      item.id === challenge.id && entry.status === "passed" ? { ...item, state: "completed" } : item
    );
    const payload = snapshot(session);
    session.events.emit("timer", payload);
    return entry;
  }

  function listSubmissions({ sessionId, actorId }) {
    const session = getSession(sessionId);
    if (!session) {
      const error = new Error(`Unknown session: ${sessionId}`);
      error.code = 404;
      throw error;
    }
    assertOwner(session, actorId);
    return session.submissions.slice();
  }

  function subscribe(sessionId, onTimer) {
    const session = getSession(sessionId);
    if (!session) return () => {};
    const handler = (event) => onTimer(event);
    session.events.on("timer", handler);
    return () => session.events.off("timer", handler);
  }

  return {
    createSession,
    getSession,
    snapshot,
    snapshotForRole,
    mutateTimer,
    assignChallenges,
    startAssignedChallenge,
    challengeForRun,
    selectVisibleChallenge,
    addSubmission,
    listSubmissions,
    subscribe
  };
}

function normalizeChallenges(challenges) {
  const list = Array.isArray(challenges) ? challenges : [];
  const seen = new Set();
  const normalized = [];
  for (const challenge of list) {
    const id = String(challenge?.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      title: String(challenge?.title || ""),
      details: String(challenge?.details || ""),
      starterCode: String(challenge?.starterCode || ""),
      state: challenge?.state === "started" || challenge?.state === "completed" ? challenge.state : "pending"
    });
  }
  return normalized;
}

module.exports = { createInterviewSessionStore };
