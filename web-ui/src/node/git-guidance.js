const { spawnSync } = require("node:child_process");

function buildGitGuidance({ cwd, relativeSavePath, challengeId, userId }) {
  const gitTopLevel = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8"
  });

  if (gitTopLevel.status !== 0) {
    return {
      available: false,
      reason: "Git commands are unavailable because this directory is not a Git repository.",
      commands: []
    };
  }

  const commitMessage = `Save challenge ${challengeId} solution for ${userId}`;
  return {
    available: true,
    reason: null,
    commands: [
      `git add ${shellQuote(relativeSavePath)}`,
      `git commit -m ${shellQuote(commitMessage)}`,
      "git push"
    ]
  };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

module.exports = {
  buildGitGuidance
};
