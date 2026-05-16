const path = require("node:path");
try { process.loadEnvFile(path.resolve(__dirname, "../.env")); } catch (e) {}
const express = require("express");
const { ensureJavaRuntimeCompiled, evaluateChallenge } = require("./src/node/java-runtime");
const { availableProviders, reviewCode, hintCode } = require("./src/node/ai-provider");
const {
  listChallenges,
  challengeById,
  writeChallengesFile,
  extractChallengeRuntimeFiles,
  loadChallengesFile,
  runtimeChallengesRoot
} = require("./src/node/challenge-loader");
const { createSolutionStore } = require("./src/node/solution-store");
const { createLeaderboardStore } = require("./src/node/leaderboard-store");
const { buildGitGuidance } = require("./src/node/git-guidance");
const { normalizeChallengeId, normalizeUserId } = require("./src/node/validation");
const { createInterviewSessionStore } = require("./src/node/interview-session-store");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const repoRoot = path.resolve(__dirname, "..");
const runnableChallengeIds = new Set(
  String(process.env.SANDBOX_RUNNABLE_CHALLENGE_IDS || "1,4,24")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
app.use("/public", express.static(path.join(__dirname, "public")));

extractChallengeRuntimeFiles();
ensureJavaRuntimeCompiled();

const solutionStore = createSolutionStore(path.join(runtimeChallengesRoot));
const leaderboard = createLeaderboardStore();
const interviewSessions = createInterviewSessionStore();

app.get("/", (_req, res) => {
  const challenges = listChallenges();
  res.render("index", {
    availableProviders,
    initialStateJson: JSON.stringify({ challenges, availableProviders })
  });
});

app.get("/api/challenges", (_req, res) => {
  const challenges = listChallenges();
  const completed = challenges.filter((challenge) => challenge.status === "completed").length;
  const progress = challenges.length ? Math.round((completed / challenges.length) * 100) : 0;
  res.json({ challenges, progress });
});

app.get("/api/challenges/:challengeId", (req, res) => {
  const challenge = challengeById(normalizeChallengeId(req.params.challengeId));
  if (!challenge) return res.status(404).json({ error: `Unknown challenge: ${req.params.challengeId}` });
  return res.json(challenge);
});

app.post("/api/challenges/:challengeId/run-tests", async (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const evaluation = await evaluateChallenge(challengeId, req.body.code || "");
    res.json(evaluation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/submit", async (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const userId = normalizeUserId(req.body.userId || "guest");
    const sourceCode = String(req.body.code || "");
    const saveResult = solutionStore.save({ challengeId, userId, sourceCode });
    const evaluation = await evaluateChallenge(challengeId, sourceCode);

    writeChallengesFile((data) => {
      const challenge = data.challenges.find((entry) => Number(entry.id) === Number(challengeId));
      if (!challenge) return data;
      const score = Number(evaluation.correctnessPoints || 0);
      challenge.score = score;
      challenge.bestScore = Math.max(Number(challenge.bestScore || 0), score);
      challenge.attempts = Number(challenge.attempts || 0) + 1;
      if (score === 100) {
        challenge.status = "completed";
        challenge.completedAt = new Date().toISOString();
      } else if (challenge.status === "not-started") {
        challenge.status = "in-progress";
      }
      return data;
    });

    leaderboard.record(userId, evaluation.correctnessPoints);

    res.json({
      challengeId,
      userId,
      savePath: saveResult.relativePath,
      evaluation,
      git: buildGitGuidance({ cwd: repoRoot, relativeSavePath: saveResult.relativePath, challengeId, userId })
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/time", (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const elapsedMs = Math.max(0, Number.parseInt(String(req.body.elapsedMs || "0"), 10) || 0);
    writeChallengesFile((data) => {
      const challenge = data.challenges.find((entry) => Number(entry.id) === Number(challengeId));
      if (!challenge) return data;
      challenge.timeSpentMs = Number(challenge.timeSpentMs || 0) + elapsedMs;
      if (challenge.status === "not-started") challenge.status = "in-progress";
      return data;
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/notes", (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const notes = String(req.body.notes || "");
    writeChallengesFile((data) => {
      const challenge = data.challenges.find((entry) => Number(entry.id) === Number(challengeId));
      if (!challenge) return data;
      challenge.notes = notes;
      return data;
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/review", async (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const provider = String(req.body.provider || "");
    const challenge = challengeById(challengeId);
    const review = await reviewCode(provider, challenge, req.body.code || "");
    res.json({ provider, ...review });
  } catch (error) {
    if (error.message?.startsWith("Provider not available: ")) return res.status(503).json({ error: error.message });
    return res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/hint", async (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const provider = String(req.body.provider || "");
    const challenge = challengeById(challengeId);
    const hint = await hintCode(provider, challenge, req.body.code || "", req.body.currentLevel || "");
    res.json({ provider, ...hint });
  } catch (error) {
    if (error.message?.startsWith("Provider not available: ")) return res.status(503).json({ error: error.message });
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/leaderboard", (_req, res) => {
  res.json({ entries: leaderboard.top() });
});

app.post("/api/interview-sessions", (req, res) => {
  try {
    const interviewerId = String(req.body.interviewerId || "interviewer");
    const intervieweeId = String(req.body.intervieweeId || "interviewee");
    const durationMs = Math.max(0, Number.parseInt(String(req.body.durationMs || "2700000"), 10) || 0);
    const challengeIds = resolveSessionChallengeIds(req.body.challengeIds, req.body.challengeId, { allowEmpty: true });
    const challenges = challengeIds.map((challengeId) => {
      const challenge = challengeById(challengeId);
      return {
        id: challengeId,
        title: challenge.title,
        details: challenge.details,
        starterCode: challenge.starterCode
      };
    });
    const session = interviewSessions.createSession({
      interviewerId,
      intervieweeId,
      durationMs,
      challenges
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(error.code || 400).json({ error: error.message });
  }
});

app.get("/interviewer/:sessionId", (req, res) => {
  res.render("interviewer", {
    pageStateJson: JSON.stringify({ sessionId: String(req.params.sessionId || ""), role: "interviewer" })
  });
});

app.get("/interviewee/:sessionId", (req, res) => {
  res.render("interviewee", {
    pageStateJson: JSON.stringify({ sessionId: String(req.params.sessionId || ""), role: "interviewee" })
  });
});

app.get("/api/interview-sessions/:sessionId/state", (req, res) => {
  const session = interviewSessions.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: `Unknown session: ${req.params.sessionId}` });
  const actorId = String(req.get("x-actor-id") || req.query.actorId || "");
  const role = actorId === session.interviewerId ? "interviewer" : "interviewee";
  return res.json(interviewSessions.snapshotForRole(session, role));
});

app.post("/api/interview-sessions/:sessionId/challenges", (req, res) => {
  try {
    const actorId = String(req.get("x-actor-id") || req.body.actorId || "");
    const challengeIds = resolveSessionChallengeIds(req.body.challengeIds, req.body.challengeId);
    const challenges = challengeIds.map((challengeId) => {
      const challenge = challengeById(challengeId);
      return {
        id: challengeId,
        title: challenge.title,
        details: challenge.details,
        starterCode: challenge.starterCode
      };
    });
    const snapshot = interviewSessions.assignChallenges({
      sessionId: req.params.sessionId,
      actorId,
      challenges
    });
    res.json(snapshot);
  } catch (error) {
    res.status(error.code || 400).json({ error: error.message });
  }
});

app.post("/api/interview-sessions/:sessionId/challenges/:challengeId/start", (req, res) => {
  try {
    const actorId = String(req.get("x-actor-id") || req.body.actorId || "");
    const challengeId = requireRunnableChallengeId(req.params.challengeId);
    const snapshot = interviewSessions.startAssignedChallenge({
      sessionId: req.params.sessionId,
      actorId,
      challengeId
    });
    res.json(snapshot);
  } catch (error) {
    res.status(error.code || 400).json({ error: error.message });
  }
});

app.get("/api/interview-sessions/:sessionId/challenges", (req, res) => {
  const session = interviewSessions.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: `Unknown session: ${req.params.sessionId}` });
  return res.json({
    challenges: listChallenges()
      .filter((challenge) => runnableChallengeIds.has(String(challenge.id)))
      .map((challenge) => ({ id: String(challenge.id), title: challenge.title }))
  });
});

app.post("/api/interview-sessions/:sessionId/timer/start", (req, res) => mutateTimer(req, res, "start"));
app.post("/api/interview-sessions/:sessionId/timer/pause", (req, res) => mutateTimer(req, res, "pause"));
app.post("/api/interview-sessions/:sessionId/timer/resume", (req, res) => mutateTimer(req, res, "resume"));
app.post("/api/interview-sessions/:sessionId/timer/end", (req, res) => mutateTimer(req, res, "end"));
app.post("/api/interview-sessions/:sessionId/timer/adjust", (req, res) => mutateTimer(req, res, "adjust"));

app.post("/api/interview-sessions/:sessionId/challenge-access", (req, res) => {
  try {
    const session = interviewSessions.getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: `Unknown session: ${req.params.sessionId}` });
    const actorId = String(req.get("x-actor-id") || req.body.actorId || "");
    const challengeId = requireRunnableChallengeId(req.body.challengeId);
    interviewSessions.selectVisibleChallenge({ sessionId: req.params.sessionId, actorId, challengeId });
    const role = actorId === session.interviewerId ? "interviewer" : "interviewee";
    res.json(interviewSessions.snapshotForRole(session, role));
  } catch (error) {
    res.status(error.code || 400).json(error.payload || { error: error.message });
  }
});

app.post("/api/interview-sessions/:sessionId/challenge-run", async (req, res) => {
  try {
    const actorId = String(req.get("x-actor-id") || req.body.actorId || "");
    const challengeId = requireRunnableChallengeId(req.body.challengeId);
    interviewSessions.challengeForRun({ sessionId: req.params.sessionId, actorId, challengeId });
    const evaluation = await evaluateChallenge(challengeId, req.body.code || "");
    res.json(evaluation);
  } catch (error) {
    res.status(error.code || 400).json(error.payload || { error: error.message });
  }
});

app.post("/api/interview-sessions/:sessionId/submissions", async (req, res) => {
  try {
    const session = interviewSessions.getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: `Unknown session: ${req.params.sessionId}` });
    const actorId = String(req.get("x-actor-id") || req.body.actorId || "");
    const challengeId = String(req.body.challengeId || session.activeChallengeId || "");
    interviewSessions.challengeForRun({ sessionId: req.params.sessionId, actorId, challengeId });
    const code = String(req.body.code || "");
    const evaluation = await evaluateChallenge(challengeId, code);
    const status = Number(evaluation.correctnessPoints || 0) === 100 ? "passed" : "failed";
    const submission = interviewSessions.addSubmission({
      sessionId: req.params.sessionId,
      actorId,
      challengeId,
      code,
      output: evaluation,
      status
    });
    res.status(201).json({ submission, evaluation });
  } catch (error) {
    res.status(error.code || 400).json({ error: error.message });
  }
});

app.get("/api/interview-sessions/:sessionId/submissions", (req, res) => {
  try {
    const actorId = String(req.get("x-actor-id") || req.query.actorId || "");
    const submissions = interviewSessions.listSubmissions({
      sessionId: req.params.sessionId,
      actorId
    });
    res.json({ submissions });
  } catch (error) {
    res.status(error.code || 400).json({ error: error.message });
  }
});

app.get("/api/interview-sessions/:sessionId/events", (req, res) => {
  const session = interviewSessions.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: `Unknown session: ${req.params.sessionId}` });
  const actorId = String(req.get("x-actor-id") || req.query.actorId || "");
  const role = actorId === session.interviewerId ? "interviewer" : "interviewee";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`event: session.snapshot\n`);
  res.write(`data: ${JSON.stringify(interviewSessions.snapshotForRole(session, role))}\n\n`);

  const unsubscribe = interviewSessions.subscribe(req.params.sessionId, (event) => {
    const scoped = role === "interviewer" ? event : interviewSessions.snapshotForRole(session, role);
    res.write(`event: timer.${event.timerState}\n`);
    res.write(`data: ${JSON.stringify(scoped)}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
});

app.listen(port, () => {
  const configuredPrompt = loadChallengesFile().systemPrompt;
  process.stdout.write(`Java Interview Practice UI running at http://localhost:${port} (system prompt: ${configuredPrompt})\n`);
});

function requireChallengeId(rawChallengeId) {
  const challengeId = normalizeChallengeId(rawChallengeId);
  if (!challengeById(challengeId)) throw new Error(`Unknown challenge: ${challengeId}`);
  return challengeId;
}

function resolveSessionChallengeIds(rawChallengeIds, rawChallengeId, options) {
  const list = Array.isArray(rawChallengeIds)
    ? rawChallengeIds
    : rawChallengeIds === undefined && rawChallengeId !== undefined
    ? [rawChallengeId]
    : [];
  const normalized = [];
  const seen = new Set();
  for (const raw of list) {
    const challengeId = requireRunnableChallengeId(raw);
    if (seen.has(challengeId)) continue;
    seen.add(challengeId);
    normalized.push(challengeId);
  }
  if (!normalized.length && !options?.allowEmpty) {
    const error = new Error("At least one challengeId is required");
    error.code = 400;
    throw error;
  }
  return normalized;
}

function requireRunnableChallengeId(rawChallengeId) {
  const challengeId = requireChallengeId(rawChallengeId);
  if (!runnableChallengeIds.has(String(challengeId))) {
    throw new Error(
      `Challenge ${challengeId} is not runnable in current sandbox runtime. Supported: ${Array.from(runnableChallengeIds).join(", ")}`
    );
  }
  return challengeId;
}

function mutateTimer(req, res, action) {
  try {
    const actorId = String(req.get("x-actor-id") || req.body.actorId || "");
    const expectedVersion = Number.parseInt(String(req.body.expectedVersion ?? "-1"), 10);
    const deltaMs = Number.parseInt(String(req.body.deltaMs || "0"), 10) || 0;
    const result = interviewSessions.mutateTimer({
      sessionId: req.params.sessionId,
      actorId,
      action,
      expectedVersion,
      deltaMs
    });
    res.json(result);
  } catch (error) {
    res.status(error.code || 400).json({
      error: error.message,
      ...(error.currentVersion !== undefined ? { currentVersion: error.currentVersion } : {})
    });
  }
}
