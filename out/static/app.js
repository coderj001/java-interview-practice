const state = {
  activeChallengeId: null,
  challenges: [],
  drafts: {},
  currentHintLevel: null
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

document.getElementById("run-tests").addEventListener("click", () => runAction("run-tests"));
document.getElementById("submit-solution").addEventListener("click", () => runAction("submit"));
document.getElementById("request-review").addEventListener("click", requestReview);
document.getElementById("request-hint").addEventListener("click", requestHint);
editor.addEventListener("input", () => {
  if (state.activeChallengeId) {
    state.drafts[state.activeChallengeId] = editor.value;
  }
});

loadChallenges();
loadLeaderboard();

async function loadChallenges() {
  const response = await fetch("/api/challenges");
  const payload = await response.json();
  state.challenges = payload.challenges;
  renderChallengeList();
  if (state.challenges.length > 0) {
    selectChallenge(state.challenges[0].id);
  }
}

function renderChallengeList() {
  challengeList.innerHTML = "";
  state.challenges.forEach((challenge) => {
    const button = document.createElement("button");
    button.className = "challenge-card";
    if (challenge.id === state.activeChallengeId) {
      button.classList.add("active");
    }
    button.innerHTML = `<strong>${challenge.title}</strong><span>${challenge.difficulty}</span>`;
    button.addEventListener("click", () => selectChallenge(challenge.id));
    challengeList.appendChild(button);
  });
}

function selectChallenge(id) {
  state.activeChallengeId = id;
  state.currentHintLevel = null;
  renderChallengeList();

  const challenge = state.challenges.find((item) => item.id === id);
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
  if (action === "submit") {
    renderEvaluation(payload.evaluation);
    resultSummary.textContent = `Submission ${payload.submissionId} is ${payload.status}. ${payload.evaluation.message}`;
    await loadLeaderboard();
    return;
  }

  renderEvaluation(payload);
}

async function requestReview() {
  if (!state.activeChallengeId) {
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
  reviewOutput.textContent = `${payload.provider}: ${payload.qualityAssessment} ${payload.improvementSuggestion}`;
  followUpQuestions.innerHTML = "";
  payload.followUpQuestions.forEach((question) => {
    const item = document.createElement("li");
    item.textContent = question;
    followUpQuestions.appendChild(item);
  });
}

async function requestHint() {
  if (!state.activeChallengeId) {
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
  state.currentHintLevel = payload.level;
  reviewOutput.textContent = `${payload.provider} ${payload.level}: ${payload.hint}`;
  followUpQuestions.innerHTML = "";
  const item = document.createElement("li");
  item.textContent = `Next hint button advances to ${payload.nextLevel}.`;
  followUpQuestions.appendChild(item);
}

function renderEvaluation(payload) {
  const normalizedStatus = payload.status === "PASSED" ? "status-pass" : payload.status === "PARTIAL" ? "status-partial" : "status-fail";
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

async function loadLeaderboard() {
  const response = await fetch("/api/leaderboard");
  const payload = await response.json();
  leaderboard.innerHTML = "";

  if (payload.entries.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No submissions yet.";
    leaderboard.appendChild(item);
    return;
  }

  payload.entries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${entry.userId} — ${entry.bestScore}`;
    leaderboard.appendChild(item);
  });
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
