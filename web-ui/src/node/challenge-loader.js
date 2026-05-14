const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const challengesRoot = path.join(repoRoot, "challenges");

function listChallenges() {
  const entries = fs.readdirSync(challengesRoot, { withFileTypes: true });
  const challenges = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("challenge-")) {
      continue;
    }
    const challengeDir = path.join(challengesRoot, entry.name);
    challenges.push(loadChallenge(challengeDir));
  }
  challenges.sort((left, right) => Number.parseInt(left.id, 10) - Number.parseInt(right.id, 10));
  return challenges;
}

function resolveChallengeDirectory(challengeId) {
  return path.join(challengesRoot, `challenge-${challengeId}`);
}

function loadChallenge(challengeDir) {
  const metadataPath = path.join(challengeDir, "challenge.json");
  const promptPath = path.join(challengeDir, "prompt.md");
  const starterPath = path.join(challengeDir, "starter", "Solution.java");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const prompt = fs.readFileSync(promptPath, "utf8").trimEnd();
  const starterCode = fs.readFileSync(starterPath, "utf8");

  return {
    id: String(metadata.id),
    title: String(metadata.title),
    difficulty: String(metadata.difficulty),
    prompt,
    explanation: String(metadata.explanation),
    starterCode,
    methodContract: String(metadata.methodContract),
    resources: normalizeStringArray(metadata.resources),
    examples: normalizeStringArray(metadata.examples)
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

module.exports = {
  listChallenges,
  resolveChallengeDirectory,
  challengesRoot
};
