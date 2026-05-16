(function () {
  const page = window.__SESSION_PAGE__ || {};
  const app = document.getElementById("session-app");
  if (!app || !page.sessionId) return;

  const state = {
    snapshot: null,
    timerHandle: null,
    editor: null,
    vimMode: false,
    challenges: [],
    submissions: []
  };

  render();
  bootstrap();

  async function bootstrap() {
    await loadSnapshot();
    if (page.role === "interviewer") {
      await Promise.all([loadChallengeOptions(), loadSubmissions()]);
    }
    startLocalTicker();
    subscribeEvents();
    render();
  }

  async function loadSnapshot() {
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/state`);
    state.snapshot = await res.json();
  }

  async function loadChallengeOptions() {
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/challenges`);
    const payload = await res.json();
    state.challenges = payload.challenges || [];
  }

  async function loadSubmissions() {
    const actorId = document.getElementById("actor-id")?.value || "";
    const query = new URLSearchParams({ actorId });
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/submissions?${query.toString()}`, {
      headers: { "x-actor-id": actorId }
    });
    const payload = await res.json();
    state.submissions = payload.submissions || [];
  }

  function subscribeEvents() {
    const stream = new EventSource(`/api/interview-sessions/${page.sessionId}/events`);
    ["session.snapshot", "timer.idle", "timer.running", "timer.paused", "timer.ended"].forEach((name) => {
      stream.addEventListener(name, async (event) => {
        const payload = JSON.parse(event.data || "{}");
        if (!state.snapshot || Number(payload.version) >= Number(state.snapshot.version)) {
          state.snapshot = payload;
          if (page.role === "interviewer") await loadSubmissions();
          render();
        }
      });
    });
  }

  function startLocalTicker() {
    clearInterval(state.timerHandle);
    state.timerHandle = setInterval(render, 1000);
  }

  async function command(action, extra) {
    const actorId = document.getElementById("actor-id")?.value || "";
    const body = {
      expectedVersion: state.snapshot ? state.snapshot.version : 0,
      actorId,
      ...(extra || {})
    };
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/timer/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify(body)
    });
    const payload = await res.json();
    if (!res.ok) alert(payload.error || "Timer command failed");
  }

  function render() {
    if ((page.role || "interviewee") === "interviewer") return renderInterviewer();
    return renderInterviewee();
  }

  function renderInterviewer() {
    const snap = state.snapshot;
    const remainingMs = renderRemainingMs(snap);
    const progressPct = Number(snap?.progressPct || 0);
    const challenge = snap?.challenge || {};
    const options = (state.challenges || [])
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(challenge.id) ? "selected" : ""}>#${escapeHtml(
            item.id
          )} ${escapeHtml(item.title)}</option>`
      )
      .join("");
    const logs = (state.submissions || [])
      .slice()
      .reverse()
      .map(
        (entry) => `<details>
            <summary>${escapeHtml(entry.submittedAt)} | ${escapeHtml(entry.status)}</summary>
            <pre>${escapeHtml(entry.code || "")}</pre>
            <pre>${escapeHtml(JSON.stringify(entry.output || {}, null, 2))}</pre>
          </details>`
      )
      .join("");

    app.innerHTML = `<section class="workspace">
      <div class="workspace-head">
        <h2>Interviewer Console</h2>
        <div id="session-timer">${formatDuration(remainingMs)}</div>
      </div>
      <p><strong>State:</strong> ${escapeHtml(snap?.timerState || "loading")} | <strong>Phase:</strong> ${escapeHtml(
      snap?.phase || "-"
    )}</p>
      <label>Challenge
        <select id="challenge-select">${options}</select>
      </label>
      <div class="progress"><div style="width:${progressPct}%"></div></div>
      <p><strong>Elapsed:</strong> ${formatDuration(snap?.elapsedMs || 0)} / <strong>Total:</strong> ${formatDuration(
      snap?.totalBudgetMs || 0
    )}</p>
      <div class="editor-tools">
        <button data-action="start">Start</button>
        <button data-action="pause">Pause</button>
        <button data-action="resume">Resume</button>
        <button data-action="end">End</button>
        <button data-adjust="60000">+1 min</button>
        <button data-adjust="300000">+5 min</button>
        <button data-adjust="600000">+10 min</button>
      </div>
      <h3>Submission Logs</h3>
      ${logs || "<p>No submissions yet.</p>"}
    </section>`;

    app.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => command(button.getAttribute("data-action")));
    });
    app.querySelectorAll("[data-adjust]").forEach((button) => {
      button.addEventListener("click", () => command("adjust", { deltaMs: Number(button.getAttribute("data-adjust")) || 0 }));
    });
    const challengeSelect = document.getElementById("challenge-select");
    if (challengeSelect) {
      challengeSelect.disabled = snap?.phase === "running" || snap?.phase === "paused" || snap?.phase === "ended";
      challengeSelect.addEventListener("change", () => assignChallenge(challengeSelect.value));
    }
  }

  function renderInterviewee() {
    const snap = state.snapshot;
    const challenge = snap?.challenge || null;
    const remainingMs = renderRemainingMs(snap);
    const progressPct = Number(snap?.progressPct || 0);

    if (!challenge || !challenge.id) {
      app.innerHTML = `<p>Waiting for interviewer to assign challenge.</p>
      <p><strong>State:</strong> ${escapeHtml(snap?.timerState || "loading")}</p>
      <p><strong>Remaining:</strong> ${formatDuration(remainingMs)}</p>`;
      return;
    }

    const mounted = app.dataset.workspaceMounted === "true";
    if (!mounted) {
      app.innerHTML = `<section class="workspace">
        <div class="workspace-head">
          <h2>${escapeHtml(challenge.title)}</h2>
          <div id="session-timer">${formatDuration(remainingMs)}</div>
        </div>
        <div class="progress"><div id="session-progress" style="width:${progressPct}%"></div></div>
        <article class="markdown" id="session-details">${renderMarkdown(challenge.details || "")}</article>
        <div class="editor-tools">
          <button id="vim-toggle">VIM</button>
          <button id="run-tests">Run Tests</button>
          <button id="submit">Submit</button>
        </div>
        <div id="editor"></div>
        <pre id="candidate-output">Ready.</pre>
      </section>`;
      app.dataset.workspaceMounted = "true";
      mountEditor(challenge);
      bindIntervieweeHandlers();
    }

    const timer = document.getElementById("session-timer");
    if (timer) timer.textContent = formatDuration(remainingMs);
    const progress = document.getElementById("session-progress");
    if (progress) progress.style.width = `${progressPct}%`;
  }

  async function assignChallenge(challengeId) {
    const actorId = document.getElementById("actor-id")?.value || "";
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify({ challengeId, actorId })
    });
    const payload = await res.json();
    if (!res.ok) {
      alert(payload.error || "Unable to assign challenge");
      return;
    }
    state.snapshot = payload;
    render();
  }

  function mountEditor(challenge) {
    const host = document.getElementById("editor");
    if (!host) return;
    state.editor?.destroy?.();
    if (window.CodeMirrorApp) {
      state.editor = window.CodeMirrorApp.createEditor({
        element: host,
        value: challenge.starterCode || "",
        vimMode: state.vimMode
      });
      return;
    }
    state.editor = null;
    host.innerHTML = `<textarea id="candidate-code-fallback" rows="16">${escapeHtml(challenge.starterCode || "")}</textarea>`;
  }

  function bindIntervieweeHandlers() {
    const vim = document.getElementById("vim-toggle");
    if (vim) {
      vim.addEventListener("click", () => {
        state.vimMode = !state.vimMode;
        const challenge = state.snapshot?.challenge || {};
        const current = editorCode();
        mountEditor({ ...challenge, starterCode: current });
      });
    }
    const runTests = document.getElementById("run-tests");
    if (runTests) runTests.addEventListener("click", () => runTestsForAssignedChallenge());
    const submit = document.getElementById("submit");
    if (submit) submit.addEventListener("click", () => submitSnapshot());
  }

  async function runTestsForAssignedChallenge() {
    if (!state.snapshot?.challenge?.id) return;
    const code = editorCode();
    const userId = state.snapshot.intervieweeId || "interviewee";
    const body = new URLSearchParams({ code, userId });
    const res = await fetch(`/api/challenges/${encodeURIComponent(state.snapshot.challenge.id)}/run-tests`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString()
    });
    const payload = await res.json();
    const output = document.getElementById("candidate-output");
    if (output) output.textContent = JSON.stringify(payload, null, 2);
  }

  async function submitSnapshot() {
    const actorId = state.snapshot?.intervieweeId || "interviewee";
    const body = { actorId, code: editorCode() };
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify(body)
    });
    const payload = await res.json();
    const output = document.getElementById("candidate-output");
    if (output) output.textContent = JSON.stringify(payload, null, 2);
  }

  function renderRemainingMs(snapshot) {
    if (!snapshot) return 0;
    if (snapshot.timerState !== "running") return Math.max(0, Number(snapshot.remainingMs || 0));
    const drift = Math.max(0, Date.now() - Number(snapshot.serverTime || Date.now()));
    return Math.max(0, Number(snapshot.remainingMs || 0) - drift);
  }

  function formatDuration(ms) {
    const totalSeconds = Math.floor(Math.max(0, Number(ms || 0)) / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function renderMarkdown(text) {
    return window.marked ? window.marked.parse(String(text || "")) : escapeHtml(String(text || ""));
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function editorCode() {
    if (state.editor && state.editor.state?.doc) return state.editor.state.doc.toString();
    return document.getElementById("candidate-code-fallback")?.value || "";
  }
})();
