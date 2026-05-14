const initialState = window.__INITIAL_STATE__ || {};
const state = {
  activeChallengeId: initialState.initialChallengeId || null,
  challenges: initialState.challenges || [],
  drafts: {},
  currentHintLevel: null,
  leaderboard: initialState.leaderboard || []
};

const challengeList = document.getElementById("challenge-list");
const title = document.getElementById("challenge-title");
const promptText = document.getElementById("challenge-prompt");
const difficulty = document.getElementById("challenge-difficulty");
const contract = document.getElementById("challenge-contract");
const explanation = document.getElementById("challenge-explanation");
const examples = document.getElementById("examples");
const resources = document.getElementById("resources");
const editor = document.getElementById("editor");
const resultStatus = document.getElementById("result-status");
const resultSummary = document.getElementById("result-summary");
const testResults = document.getElementById("test-results");
const diagnostics = document.getElementById("diagnostics");
const reviewOutput = document.getElementById("review-output");
const followUpQuestions = document.getElementById("follow-up-questions");
const leaderboard = document.getElementById("leaderboard");
const userId = document.getElementById("user-id");
const provider = document.getElementById("provider");
const savePath = document.getElementById("save-path");
const gitCommands = document.getElementById("git-commands");
const reviewButton = document.getElementById("request-review");
const hintButton = document.getElementById("request-hint");

challengeList.querySelectorAll("[data-challenge-id]").forEach((button) => {
  button.addEventListener("click", () => selectChallenge(button.dataset.challengeId));
});

document.getElementById("run-tests").addEventListener("click", () => runAction("run-tests"));
document.getElementById("submit-solution").addEventListener("click", () => runAction("submit"));
if (reviewButton) {
  reviewButton.addEventListener("click", requestReview);
}
if (hintButton) {
  hintButton.addEventListener("click", requestHint);
}
editor.addEventListener("input", () => {
  if (state.activeChallengeId) {
    state.drafts[state.activeChallengeId] = editor.value;
  }
});

if (state.activeChallengeId) {
  const initialChallenge = challengeById(state.activeChallengeId);
  state.drafts[state.activeChallengeId] = editor.value || initialChallenge.starterCode;
}

renderLeaderboard(state.leaderboard);

function selectChallenge(id) {
  state.activeChallengeId = id;
  state.currentHintLevel = null;
  renderChallengeList();

  const challenge = challengeById(id);
  if (!challenge) {
    return;
  }

  title.textContent = challenge.title;
  promptText.textContent = challenge.prompt;
  difficulty.textContent = challenge.difficulty;
  contract.textContent = challenge.methodContract;
  explanation.textContent = challenge.explanation;
  editor.value = state.drafts[id] || challenge.starterCode;
  state.drafts[id] = editor.value;

  examples.innerHTML = "";
  challenge.examples.forEach((example) => {
    const item = document.createElement("li");
    item.textContent = example;
    examples.appendChild(item);
  });

  resources.innerHTML = "";
  challenge.resources.forEach((resource) => {
    const item = document.createElement("li");
    item.innerHTML = `<a href="${resource}" target="_blank" rel="noreferrer">${resource}</a>`;
    resources.appendChild(item);
  });

  clearEvaluation();
  clearCoach();
  clearSaveFeedback();
}

function renderChallengeList() {
  challengeList.querySelectorAll("[data-challenge-id]").forEach((button) => {
    button.classList.toggle("active", button.dataset.challengeId === state.activeChallengeId);
  });
}

async function runAction(action) {
  if (!state.activeChallengeId) {
    return;
  }

  const body = new URLSearchParams({
    code: editor.value,
    userId: userId.value
  });

  const response = await fetch(`/api/challenges/${state.activeChallengeId}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: body.toString()
  });
  const payload = await response.json();

  if (!response.ok) {
    renderError(payload.error || "Request failed.");
    return;
  }

  if (action === "submit") {
    renderEvaluation(payload.evaluation);
    renderSaveFeedback(payload);
    await loadLeaderboard();
    return;
  }

  clearSaveFeedback();
  renderEvaluation(payload);
}

async function requestReview() {
  if (!state.activeChallengeId || !provider) {
    return;
  }

  const body = new URLSearchParams({
    code: editor.value,
    provider: provider.value
  });

  const response = await fetch(`/api/challenges/${state.activeChallengeId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: body.toString()
  });
  const payload = await response.json();

  if (!response.ok) {
    renderError(payload.error || "Review failed.");
    return;
  }

  reviewOutput.textContent = `${payload.provider}: ${payload.qualityAssessment} ${payload.improvementSuggestion}`;
  followUpQuestions.innerHTML = "";
  payload.followUpQuestions.forEach((question) => {
    const item = document.createElement("li");
    item.textContent = question;
    followUpQuestions.appendChild(item);
  });
}

async function requestHint() {
  if (!state.activeChallengeId || !provider) {
    return;
  }

  const body = new URLSearchParams({
    code: editor.value,
    provider: provider.value,
    currentLevel: state.currentHintLevel || ""
  });

  const response = await fetch(`/api/challenges/${state.activeChallengeId}/hint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: body.toString()
  });
  const payload = await response.json();

  if (!response.ok) {
    renderError(payload.error || "Hint failed.");
    return;
  }

  state.currentHintLevel = payload.level;
  reviewOutput.textContent = `${payload.provider} ${payload.level}: ${payload.hint}`;
  followUpQuestions.innerHTML = "";
  const item = document.createElement("li");
  item.textContent = `Next hint button advances to ${payload.nextLevel}.`;
  followUpQuestions.appendChild(item);
}

async function loadLeaderboard() {
  const response = await fetch("/api/leaderboard");
  const payload = await response.json();
  state.leaderboard = payload.entries;
  renderLeaderboard(payload.entries);
}

function renderLeaderboard(entries) {
  leaderboard.innerHTML = "";
  if (!entries.length) {
    const item = document.createElement("li");
    item.textContent = "No submissions yet.";
    leaderboard.appendChild(item);
    return;
  }

  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${entry.userId} - ${entry.bestScore}`;
    leaderboard.appendChild(item);
  });
}

function renderEvaluation(payload) {
  const normalizedStatus = payload.status === "PASSED"
    ? "status-pass"
    : payload.status === "PARTIAL"
      ? "status-partial"
      : "status-fail";
  resultStatus.textContent = payload.status;
  resultStatus.className = `status-pill ${normalizedStatus}`;
  resultSummary.textContent = `${payload.message} Score ${payload.correctnessPoints}/100. ${payload.passedTests}/${payload.totalTests} tests passed in ${payload.executionTimeMillis} ms.`;

  testResults.innerHTML = "";
  payload.tests.forEach((test) => {
    const item = document.createElement("li");
    item.textContent = `${test.passed ? "PASS" : "FAIL"}: ${test.detail}`;
    testResults.appendChild(item);
  });

  diagnostics.innerHTML = "";
  payload.diagnostics.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    diagnostics.appendChild(item);
  });
}

function renderSaveFeedback(payload) {
  savePath.textContent = `Saved to ${payload.savePath}`;
  gitCommands.innerHTML = "";
  if (!payload.git.available) {
    const item = document.createElement("li");
    item.textContent = payload.git.reason;
    gitCommands.appendChild(item);
    return;
  }

  payload.git.commands.forEach((command) => {
    const item = document.createElement("li");
    item.innerHTML = `<code>${command}</code>`;
    gitCommands.appendChild(item);
  });
}

function renderError(message) {
  resultStatus.textContent = "ERROR";
  resultStatus.className = "status-pill status-fail";
  resultSummary.textContent = message;
}

function clearEvaluation() {
  resultStatus.textContent = "Idle";
  resultStatus.className = "status-pill";
  resultSummary.textContent = "Run tests to see pass/fail feedback.";
  testResults.innerHTML = "";
  diagnostics.innerHTML = "";
}

function clearCoach() {
  reviewOutput.textContent = "Request a review or hint to see coaching feedback.";
  followUpQuestions.innerHTML = "";
}

function clearSaveFeedback() {
  savePath.innerHTML = "Submit a solution to save it under <code>challenges/challenge-&lt;id&gt;/solutions/&lt;user&gt;.java</code>.";
  gitCommands.innerHTML = "";
}

function challengeById(id) {
  return state.challenges.find((challenge) => challenge.id === id);
}
