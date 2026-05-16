const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const uiRoot = path.resolve(__dirname, "..");

test("interview session script renders multi-challenge controls and gated interviewee flow", () => {
  const script = fs.readFileSync(path.join(uiRoot, "public", "interview-session.js"), "utf8");

  assert.match(script, /role === "interviewer"/);
  assert.match(script, /challenge-assign-list/);
  assert.match(script, /data-challenge-id/);
  assert.match(script, /save-challenges/);
  assert.match(script, /data-start-id/);
  assert.match(script, /challengeStates/);
  assert.match(script, /Interview Session Home/);
  assert.match(script, /Waiting for interviewer to start this challenge/);
  assert.match(script, /challenge-access/);
  assert.match(script, /challenge-run/);
  assert.match(script, /Submission Logs/);
  assert.match(script, /\+5 min/);
  assert.match(script, /\+10 min/);
});

test("interview pages load markdown parser and shared session script", () => {
  const interviewer = fs.readFileSync(path.join(uiRoot, "views", "interviewer.ejs"), "utf8");
  const interviewee = fs.readFileSync(path.join(uiRoot, "views", "interviewee.ejs"), "utf8");

  assert.match(interviewer, /marked\/marked\.min\.js/);
  assert.match(interviewee, /marked\/marked\.min\.js/);
  assert.match(interviewee, /codemirror-bundle\.js/);
  assert.match(interviewer, /\/public\/interview-session\.js/);
  assert.match(interviewee, /\/public\/interview-session\.js/);
});
