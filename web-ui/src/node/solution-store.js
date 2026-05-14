const fs = require("node:fs");
const path = require("node:path");
const { normalizeChallengeId, normalizeUserId } = require("./validation");

function createSolutionStore(challengesRootDir) {
  return {
    save({ challengeId, userId, sourceCode }) {
      const normalizedChallengeId = normalizeChallengeId(challengeId);
      const normalizedUserId = normalizeUserId(userId);
      const relativePath = path.posix.join(
        "challenges",
        `challenge-${normalizedChallengeId}`,
        "solutions",
        `${normalizedUserId}.java`
      );
      const absolutePath = path.join(
        challengesRootDir,
        `challenge-${normalizedChallengeId}`,
        "solutions",
        `${normalizedUserId}.java`
      );
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, sourceCode, "utf8");
      return { relativePath, absolutePath };
    }
  };
}

module.exports = {
  createSolutionStore
};
