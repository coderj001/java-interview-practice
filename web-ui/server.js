const path = require("node:path");
const express = require("express");
const { ensureJavaRuntimeCompiled, evaluateChallenge } = require("./src/node/java-runtime");
const { availableProviders, reviewCode, hintCode } = require("./src/node/ai-provider");
const { listChallenges, challengesRoot } = require("./src/node/challenge-loader");
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
app.use("/public", express.static(path.join(__dirname, "public")));

ensureJavaRuntimeCompiled();

const challenges = listChallenges();
const challengesById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
const solutionStore = createSolutionStore(challengesRoot);
const leaderboard = createLeaderboardStore();

app.get("/", (req, res) => {
  const initialChallenge = challenges[0] || null;
  res.render("index", {
    challenges,
    initialChallenge,
    availableProviders,
    initialStateJson: JSON.stringify({
      challenges,
      initialChallengeId: initialChallenge ? initialChallenge.id : null,
      leaderboard: leaderboard.top()
    })
  });
});

app.get("/api/challenges", (req, res) => {
  res.json({ challenges });
});

app.get("/api/challenges/:challengeId", (req, res) => {
  const challengeId = normalizeChallengeId(req.params.challengeId);
  const challenge = challengesById.get(challengeId);
  if (!challenge) {
    res.status(404).json({ error: `Unknown challenge: ${challengeId}` });
    return;
  }
  res.json(challenge);
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

    leaderboard.record(userId, evaluation.correctnessPoints);

    res.json({
      challengeId,
      userId,
      savePath: saveResult.relativePath,
      evaluation,
      git: buildGitGuidance({
        cwd: repoRoot,
        relativeSavePath: saveResult.relativePath,
        challengeId,
        userId
      })
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/challenges/:challengeId/review", (req, res) => {
  (async () => {
    try {
      const challengeId = requireChallengeId(req.params.challengeId);
      const provider = String(req.body.provider || "");
      const challenge = challengesById.get(challengeId);
      const review = await reviewCode(provider, challenge, req.body.code || "");
      res.json({ provider, ...review });
    } catch (error) {
      if (error.message && error.message.startsWith("Provider not available: ")) {
        res.status(503).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  })();
});

app.post("/api/challenges/:challengeId/hint", (req, res) => {
  (async () => {
    const challengeId = requireChallengeId(req.params.challengeId);
    try {
      const provider = String(req.body.provider || "");
      const challenge = challengesById.get(challengeId);
      const hint = await hintCode(provider, challenge, req.body.code || "", req.body.currentLevel || "");
      res.json({ provider, ...hint });
    } catch (error) {
      if (error.message && error.message.startsWith("Provider not available: ")) {
        res.status(503).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  })();
});

app.get("/api/leaderboard", (req, res) => {
  res.json({ entries: leaderboard.top() });
});

app.listen(port, () => {
  process.stdout.write(`Java Interview Practice UI running at http://localhost:${port}\n`);
});

function requireChallengeId(rawChallengeId) {
  const challengeId = normalizeChallengeId(rawChallengeId);
  if (!challengesById.has(challengeId)) {
    throw new Error(`Unknown challenge: ${challengeId}`);
  }
  return challengeId;
}
