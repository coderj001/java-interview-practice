const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { createSolutionStore } = require("../src/node/solution-store");
const { challengesRoot, listChallenges } = require("../src/node/challenge-loader");
const { buildGitGuidance } = require("../src/node/git-guidance");
const { normalizeChallengeId, normalizeUserId } = require("../src/node/validation");

test("solution store saves to deterministic challenge and user path", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "solution-store-"));
  const store = createSolutionStore(rootDir);

  const first = store.save({
    challengeId: "24",
    userId: "raju",
    sourceCode: "class Solution {}"
  });
  const second = store.save({
    challengeId: "24",
    userId: "raju",
    sourceCode: "class Solution { int value = 1; }"
  });

  assert.equal(first.relativePath, "challenges/challenge-24/solutions/raju.java");
  assert.equal(second.relativePath, "challenges/challenge-24/solutions/raju.java");
  assert.equal(fs.readFileSync(second.absolutePath, "utf8"), "class Solution { int value = 1; }");
});

test("git guidance explains when repository is unavailable", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "git-guidance-"));
  const guidance = buildGitGuidance({
    cwd: rootDir,
    relativeSavePath: "challenges/challenge-24/solutions/raju.java",
    challengeId: "24",
    userId: "raju"
  });

  assert.equal(guidance.available, false);
  assert.match(guidance.reason, /not a Git repository/i);
  assert.deepEqual(guidance.commands, []);
});

test("validation rejects unsafe path segments", () => {
  assert.throws(() => normalizeChallengeId("../24"), /letters, numbers, underscores, and hyphens/);
  assert.throws(() => normalizeUserId("raju/test"), /letters, numbers, underscores, and hyphens/);
});

test("challenge loader reads seeded challenge folders", () => {
  const challenges = listChallenges();
  assert.ok(challenges.length >= 3);
  const challenge = challenges.find((item) => item.id === "1");
  assert.ok(challenge);
  assert.match(challenge.prompt, /solve/);
  assert.match(challenge.starterCode, /public class Solution/);
  assert.equal(fs.existsSync(challengesRoot), true);
});
