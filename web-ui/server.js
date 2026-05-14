const path = require("node:path");
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

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const repoRoot = path.resolve(__dirname, "..");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
app.use("/public", express.static(path.join(__dirname, "public")));

extractChallengeRuntimeFiles();
ensureJavaRuntimeCompiled();

const solutionStore = createSolutionStore(path.join(runtimeChallengesRoot));
const leaderboard = createLeaderboardStore();

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

app.post("/api/challenges/:challengeId/run-tests", (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const evaluation = evaluateChallenge(challengeId, req.body.code || "");
    res.json(evaluation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/submit", (req, res) => {
  try {
    const challengeId = requireChallengeId(req.params.challengeId);
    const userId = normalizeUserId(req.body.userId || "guest");
    const sourceCode = String(req.body.code || "");
    const saveResult = solutionStore.save({ challengeId, userId, sourceCode });
    const evaluation = evaluateChallenge(challengeId, sourceCode);

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

app.listen(port, () => {
  const configuredPrompt = loadChallengesFile().systemPrompt;
  process.stdout.write(`Java Interview Practice UI running at http://localhost:${port} (system prompt: ${configuredPrompt})\n`);
});

function requireChallengeId(rawChallengeId) {
  const challengeId = normalizeChallengeId(rawChallengeId);
  if (!challengeById(challengeId)) throw new Error(`Unknown challenge: ${challengeId}`);
  return challengeId;
}
