const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const uiRoot = path.resolve(__dirname, "..");

test("interview session script renders challenge context for both roles", () => {
  const script = fs.readFileSync(path.join(uiRoot, "public", "interview-session.js"), "utf8");

  assert.match(script, /role === "interviewer"/);
  assert.match(script, /challenge\.title/);
  assert.match(script, /challenge\.details/);
  assert.match(script, /window\.marked/);
  assert.match(script, /id="editor"/);
  assert.match(script, /CodeMirrorApp\.createEditor/);
  assert.match(script, /runTestsForAssignedChallenge\(\)/);
  assert.match(script, /submitSnapshot\(\)/);
  assert.match(script, /\+5 min/);
  assert.match(script, /\+10 min/);
  assert.match(script, /progressPct/);
  assert.match(script, /challenge-select/);
  assert.match(script, /Submission Logs/);
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
