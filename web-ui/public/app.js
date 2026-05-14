const initialState = window.__INITIAL_STATE__ || {};
const state = { challenges: initialState.challenges || [], activeId: null, sessionStartMs: null, timer: null, hintLevel: "", vimMode: false, editor: null, notesTimer: null };
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
  app.innerHTML = `<section class="panel workspace"><div class="workspace-head"><button id="go-home">Home</button><h2>${challenge.title}</h2><div id="timer">${formatDuration(challenge.timeSpentMs || 0)}</div></div><article class="markdown" id="details"></article><div class="editor-tools"><button id="vim-toggle">VIM</button><button id="run-tests">Run Tests</button><button id="submit">Submit</button><button id="review">Review</button><button id="hint">Next Hint</button></div><div id="editor"></div><textarea id="notes" placeholder="Your notes...">${escapeHtml(challenge.notes || "")}</textarea><pre id="output">Ready.</pre><pre id="ai-output"></pre></section>`;
  document.getElementById("details").innerHTML = window.marked ? window.marked.parse(challenge.details || "") : escapeHtml(challenge.details || "");
  setupEditor(challenge);
  bindWorkspaceHandlers(challenge);
}

function setupEditor(challenge) {
  const host = document.getElementById("editor");
  if (!window.CodeMirrorApp) return;
  state.editor?.destroy?.();
  state.editor = window.CodeMirrorApp.createEditor({ element: host, value: challenge.starterCode || "", vimMode: state.vimMode });
}

function bindWorkspaceHandlers(challenge) {
  document.getElementById("go-home").addEventListener("click", () => { flushSessionTime(); window.location.hash = "#/home"; });
  document.getElementById("vim-toggle").addEventListener("click", () => { state.vimMode = !state.vimMode; renderWorkspace(); });
  document.getElementById("run-tests").addEventListener("click", () => runAction("run-tests"));
  document.getElementById("submit").addEventListener("click", () => runAction("submit"));
  document.getElementById("review").addEventListener("click", requestReview);
  document.getElementById("hint").addEventListener("click", requestHint);
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

async function runAction(action) {
  const body = new URLSearchParams({ code: editorCode(), userId: document.getElementById("user-id").value || "guest" });
  const res = await fetch(`/api/challenges/${state.activeId}/${action}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
  const payload = await res.json();
  document.getElementById("output").textContent = JSON.stringify(payload, null, 2);
  if (action === "submit") refreshChallenges();
}

async function requestReview() {
  const provider = document.getElementById("provider")?.value;
  if (!provider) return;
  const body = new URLSearchParams({ code: editorCode(), provider });
  const res = await fetch(`/api/challenges/${state.activeId}/review`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
  document.getElementById("ai-output").textContent = JSON.stringify(await res.json(), null, 2);
}

async function requestHint() {
  const provider = document.getElementById("provider")?.value;
  if (!provider) return;
  const body = new URLSearchParams({ code: editorCode(), provider, currentLevel: state.hintLevel || "" });
  const res = await fetch(`/api/challenges/${state.activeId}/hint`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString() });
  const payload = await res.json();
  state.hintLevel = payload.nextLevel === "max" ? state.hintLevel : payload.nextLevel;
  document.getElementById("ai-output").textContent = JSON.stringify(payload, null, 2);
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
