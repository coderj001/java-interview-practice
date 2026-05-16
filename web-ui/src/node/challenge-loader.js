const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const challengesJsonPath = path.join(repoRoot, "challenges.json");
const runtimeChallengesRoot = resolveRuntimeChallengesRoot();

function resolveRuntimeChallengesRoot() {
  const preferred = path.join(repoRoot, ".java-runtime", "challenges");
  if (isWritable(preferred)) return preferred;
  return path.resolve(__dirname, "..", "..", ".java-runtime", "challenges");
}

function isWritable(targetPath) {
  try {
    fs.mkdirSync(targetPath, { recursive: true });
    fs.accessSync(targetPath, fs.constants.W_OK);
    return true;
  } catch (_error) {
    return false;
  }
}

function loadChallengesFile() {
  const payload = JSON.parse(fs.readFileSync(challengesJsonPath, "utf8"));
  const challenges = Array.isArray(payload.challenges) ? payload.challenges : [];
  challenges.sort((a, b) => Number(a.id) - Number(b.id));
  return {
    systemPrompt: typeof payload.systemPrompt === "string" ? payload.systemPrompt : "system-prompt.md",
    challenges
  };
}

function listChallenges() {
  return loadChallengesFile().challenges;
}

function challengeById(challengeId) {
  const id = Number(challengeId);
  return listChallenges().find((challenge) => Number(challenge.id) === id) || null;
}

function writeChallengesFile(mutator) {
  const data = loadChallengesFile();
  const next = mutator(data) || data;
  const tempPath = `${challengesJsonPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(next, null, 2) + "\n", "utf8");
  fs.renameSync(tempPath, challengesJsonPath);
  return next;
}

function extractChallengeRuntimeFiles() {
  const { challenges } = loadChallengesFile();
  fs.mkdirSync(runtimeChallengesRoot, { recursive: true });

  for (const challenge of challenges) {
    const challengeRoot = path.join(runtimeChallengesRoot, `challenge-${challenge.id}`);
    const starterPath = path.join(challengeRoot, "starter", "Solution.java");
    const testsPath = path.join(challengeRoot, "tests", "visible-tests.json");
    fs.mkdirSync(path.dirname(starterPath), { recursive: true });
    fs.mkdirSync(path.dirname(testsPath), { recursive: true });
    fs.writeFileSync(starterPath, String(challenge.starterCode || ""), "utf8");
    fs.writeFileSync(testsPath, JSON.stringify(challenge.testCases || [], null, 2) + "\n", "utf8");
  }
}

module.exports = {
  repoRoot,
  challengesJsonPath,
  runtimeChallengesRoot,
  loadChallengesFile,
  listChallenges,
  challengeById,
  writeChallengesFile,
  extractChallengeRuntimeFiles
};
