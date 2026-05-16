const initialState = window.__INITIAL_STATE__ || {};
const state = {
  challenges: initialState.challenges || [],
  activeId: null,
  sessionStartMs: null,
  timer: null,
  hintLevel: "",
  vimMode: false,
  editor: null,
  notesTimer: null,
  editorDrafts: {},
  activeFeedbackPanel: "tests",
  activeWorkspacePanel: "code",
  lastTestResultHtml: "Ready.",
  lastReviewPayload: null,
  lastHintPayload: null
};
const app = document.getElementById("app");

window.addEventListener("hashchange", renderRoute);
window.addEventListener("beforeunload", () => flushSessionTime());
if (!window.location.hash || window.location.hash === "#") window.location.hash = "#/home";
renderRoute();

function renderRoute() {
  const hash = window.location.hash || "#/home";
  if (hash.startsWith("#/challenge/")) {
    const id = Number(hash.split("/")[2]);
    state.activeId = id;
    renderWorkspace();
    return;
  }
  flushSessionTime();
  renderHome();
}

function renderHome() {
  const completed = state.challenges.filter((c) => c.status === "completed").length;
  const progress = state.challenges.length ? Math.round((completed / state.challenges.length) * 100) : 0;
  const rows = state.challenges.map((c) => `<tr><td>${c.id}</td><td>${c.title}</td><td><span class="chip ${c.level}">${c.level}</span></td><td>${(c.tags || []).map((t) => `<span class="chip tag">${t}</span>`).join(" ")}</td><td>${c.bestScore ?? 0}</td><td>${labelStatus(c.status)}</td><td><button data-start="${c.id}">Start</button></td></tr>`).join("");
  app.innerHTML = `<section class="panel"><h2>Home</h2><div class="progress"><div style="width:${progress}%"></div></div><p>${progress}% complete</p><table><thead><tr><th>#</th><th>Name</th><th>Level</th><th>Tags</th><th>Score</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></section>`;
  app.querySelectorAll("[data-start]").forEach((btn) => btn.addEventListener("click", () => startChallenge(Number(btn.dataset.start))));
}

function renderWorkspace() {
  const challenge = state.challenges.find((c) => Number(c.id) === Number(state.activeId));
  if (!challenge) return;
  app.innerHTML = `<section class="panel workspace-shell">
    ${renderWorkspaceHeader(challenge)}
    ${renderMobileWorkspaceTabs()}
    <div class="workspace-grid">
      ${renderProblemPane()}
      ${renderCodePane()}
    </div>
    ${renderFeedbackPane(challenge)}
  </section>`;
  document.getElementById("details").innerHTML = window.marked ? window.marked.parse(challenge.details || "") : escapeHtml(challenge.details || "");
  renderFeedbackContent(challenge);
  setupEditor(challenge);
  bindWorkspaceHandlers(challenge);
}

function renderWorkspaceHeader(challenge) {
  return `<header class="workspace-head">
    <button id="go-home">Home</button>
    <h2>${escapeHtml(challenge.title)}</h2>
    <div id="timer">${formatDuration(challenge.timeSpentMs || 0)}</div>
  </header>`;
}

function renderMobileWorkspaceTabs() {
  return `<nav class="workspace-mobile-tabs">
    <button type="button" class="mobile-tab${state.activeWorkspacePanel === "problem" ? " active" : ""}" data-panel="problem">Problem</button>
    <button type="button" class="mobile-tab${state.activeWorkspacePanel === "code" ? " active" : ""}" data-panel="code">Code</button>
    <button type="button" class="mobile-tab${state.activeWorkspacePanel === "feedback" ? " active" : ""}" data-panel="feedback">Feedback</button>
  </nav>`;
}

function renderProblemPane() {
  return `<section class="workspace-pane problem-pane${state.activeWorkspacePanel === "problem" ? " mobile-active" : ""}" id="problem-pane">
    <article class="markdown" id="details"></article>
  </section>`;
}

function renderCodePane() {
  return `<section class="workspace-pane code-pane${state.activeWorkspacePanel === "code" ? " mobile-active" : ""}" id="code-pane">
    <div class="editor-tools">
      <button id="vim-toggle">VIM</button>
      <button id="run-tests">Run Tests</button>
      <button id="submit">Submit</button>
      <button id="review">Review</button>
      <button id="hint">Next Hint</button>
    </div>
    <div id="editor"></div>
  </section>`;
}

function renderFeedbackPane(challenge) {
  return `<section class="workspace-pane feedback-pane${state.activeWorkspacePanel === "feedback" ? " mobile-active" : ""}" id="feedback-pane">
    <div class="feedback-tabs">
      <button type="button" class="feedback-tab${state.activeFeedbackPanel === "tests" ? " active" : ""}" data-feedback="tests">Tests</button>
      <button type="button" class="feedback-tab${state.activeFeedbackPanel === "review" ? " active" : ""}" data-feedback="review">Review</button>
      <button type="button" class="feedback-tab${state.activeFeedbackPanel === "hint" ? " active" : ""}" data-feedback="hint">Hints</button>
      <button type="button" class="feedback-tab${state.activeFeedbackPanel === "notes" ? " active" : ""}" data-feedback="notes">Notes</button>
    </div>
    <div class="feedback-body">
      <div id="feedback-tests" class="feedback-panel${state.activeFeedbackPanel === "tests" ? " active" : ""}">${state.lastTestResultHtml || "Ready."}</div>
      <pre id="feedback-review" class="feedback-panel${state.activeFeedbackPanel === "review" ? " active" : ""}">${escapeHtml(formatJson(state.lastReviewPayload))}</pre>
      <pre id="feedback-hint" class="feedback-panel${state.activeFeedbackPanel === "hint" ? " active" : ""}">${escapeHtml(formatJson(state.lastHintPayload))}</pre>
      <textarea id="notes" class="feedback-panel${state.activeFeedbackPanel === "notes" ? " active" : ""}" placeholder="Your notes...">${escapeHtml(challenge.notes || "")}</textarea>
    </div>
  </section>`;
}

function setupEditor(challenge) {
  const host = document.getElementById("editor");
  if (!window.CodeMirrorApp) return;
  state.editor?.destroy?.();
  const draft = state.editorDrafts[String(challenge.id)];
  state.editor = window.CodeMirrorApp.createEditor({ element: host, value: draft ?? (challenge.starterCode || ""), vimMode: state.vimMode });
}

function bindWorkspaceHandlers(challenge) {
  document.getElementById("go-home").addEventListener("click", () => { flushSessionTime(); window.location.hash = "#/home"; });
  document.getElementById("vim-toggle").addEventListener("click", () => { persistEditorDraft(); state.vimMode = !state.vimMode; renderWorkspace(); });
  document.getElementById("run-tests").addEventListener("click", () => runAction("run-tests"));
  document.getElementById("submit").addEventListener("click", () => runAction("submit"));
  document.getElementById("review").addEventListener("click", requestReview);
  document.getElementById("hint").addEventListener("click", requestHint);
  app.querySelectorAll("[data-panel]").forEach((btn) => btn.addEventListener("click", () => {
    persistEditorDraft();
    state.activeWorkspacePanel = btn.dataset.panel || "code";
    renderWorkspace();
  }));
  app.querySelectorAll("[data-feedback]").forEach((btn) => btn.addEventListener("click", () => {
    persistEditorDraft();
    state.activeFeedbackPanel = btn.dataset.feedback || "tests";
    renderWorkspace();
  }));
  const notes = document.getElementById("notes");
  notes.addEventListener("input", () => {
    clearTimeout(state.notesTimer);
    state.notesTimer = setTimeout(() => saveNotes(notes.value), 2000);
  });
  notes.addEventListener("blur", () => saveNotes(notes.value));
}

function startChallenge(id) {
  const challenge = state.challenges.find((c) => Number(c.id) === id);
  if (challenge && challenge.status === "not-started") challenge.status = "in-progress";
  state.sessionStartMs = Date.now();
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    const elapsed = (challenge.timeSpentMs || 0) + (Date.now() - state.sessionStartMs);
    const timer = document.getElementById("timer");
    if (timer) timer.textContent = formatDuration(elapsed);
  }, 1000);
  window.location.hash = `#/challenge/${id}`;
}

async function flushSessionTime() {
  if (!state.activeId || !state.sessionStartMs) return;
  const elapsedMs = Date.now() - state.sessionStartMs;
  state.sessionStartMs = null;
  clearInterval(state.timer);
  await fetch(`/api/challenges/${state.activeId}/time`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ elapsedMs }) });
  await refreshChallenges();
}

async function saveNotes(notes) {
  if (!state.activeId) return;
  await fetch(`/api/challenges/${state.activeId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
}

function editorCode() { return state.editor ? state.editor.state.doc.toString() : ""; }

function persistEditorDraft() {
  if (!state.activeId) return;
  if (!state.editor) return;
  state.editorDrafts[String(state.activeId)] = editorCode();
}

async function runAction(action) {
  persistEditorDraft();
  const body = new URLSearchParams({ code: editorCode(), userId: document.getElementById("user-id").value || "guest" });
  const res = await fetch(`/api/challenges/${state.activeId}/${action}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
  const payload = await res.json();
  state.lastTestResultHtml = renderTestResults(payload);
  state.activeFeedbackPanel = "tests";
  state.activeWorkspacePanel = "feedback";
  renderWorkspace();
  if (action === "submit") refreshChallenges();
}

async function requestReview() {
  persistEditorDraft();
  const provider = document.getElementById("provider")?.value;
  if (!provider) return;
  const body = new URLSearchParams({ code: editorCode(), provider });
  const res = await fetch(`/api/challenges/${state.activeId}/review`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
  state.lastReviewPayload = await res.json();
  state.activeFeedbackPanel = "review";
  state.activeWorkspacePanel = "feedback";
  renderWorkspace();
}

async function requestHint() {
  persistEditorDraft();
  const provider = document.getElementById("provider")?.value;
  if (!provider) return;
  const body = new URLSearchParams({ code: editorCode(), provider, currentLevel: state.hintLevel || "" });
  const res = await fetch(`/api/challenges/${state.activeId}/hint`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
  const payload = await res.json();
  state.hintLevel = payload.nextLevel === "max" ? state.hintLevel : payload.nextLevel;
  state.lastHintPayload = payload;
  state.activeFeedbackPanel = "hint";
  state.activeWorkspacePanel = "feedback";
  renderWorkspace();
}

async function refreshChallenges() {
  const res = await fetch("/api/challenges");
  const payload = await res.json();
  state.challenges = payload.challenges || [];
}

function labelStatus(status) {
  if (status === "in-progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Not Started";
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function decodeHtmlEntities(text) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = String(text);
  return textArea.value;
}

function renderFeedbackContent(challenge) {
  const tests = document.getElementById("feedback-tests");
  if (tests) tests.innerHTML = state.lastTestResultHtml || "Ready.";
  const review = document.getElementById("feedback-review");
  if (review) review.textContent = formatJson(state.lastReviewPayload);
  const hint = document.getElementById("feedback-hint");
  if (hint) hint.textContent = formatJson(state.lastHintPayload);
  const notes = document.getElementById("notes");
  if (notes && notes.value !== (challenge.notes || "")) notes.value = challenge.notes || "";
}

function formatJson(value) {
  return value ? JSON.stringify(value, null, 2) : "No data yet.";
}

function renderTestResults(payload) {
  if (payload.error) {
    return `<div class="error-msg">Error: ${escapeHtml(payload.error)}</div>`;
  }
  if (!payload.tests) {
    return `<pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
  }
  
  let html = `<div class="test-summary">
    <span class="test-badge ${payload.accepted ? 'success' : 'failure'}">${payload.accepted ? 'ACCEPTED' : 'FAILED'}</span>
    <span>Score: <strong>${payload.correctnessPoints}</strong></span>
    <span>Passed: <strong>${payload.passedTests} / ${payload.totalTests}</strong></span>
  </div>`;
  
  html += `<ul class="test-list">`;
  for (const test of payload.tests) {
    const statusClass = test.passed ? 'test-passed' : 'test-failed';
    const statusIcon = test.passed ? '✅' : '❌';
    let detailHtml = '';
    
    if (test.detail) {
      const decodedDetail = decodeHtmlEntities(test.detail);
      if (decodedDetail.length > 200) {
        detailHtml = `<details class="test-detail-expand">
          <summary>${escapeHtml(decodedDetail.substring(0, 150))}...</summary>
          <pre class="test-detail-full">${escapeHtml(decodedDetail)}</pre>
        </details>`;
      } else {
        detailHtml = `<div class="test-detail-short">${escapeHtml(decodedDetail)}</div>`;
      }
    }
    
    html += `<li class="test-item ${statusClass}">
      <div class="test-name">${statusIcon} ${escapeHtml(test.name)}</div>
      ${detailHtml}
    </li>`;
  }
  html += `</ul>`;
  return html;
}
