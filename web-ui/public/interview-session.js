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
    submissions: [],
    lockedNotice: "",
    interviewerDraftIds: null,
    intervieweeViewKey: "",
    intervieweeOutputText: "Ready."
  };

  render();
  bootstrap();

  async function bootstrap() {
    await loadSnapshot();
    await loadChallengeOptions();
    if (page.role === "interviewer") await loadSubmissions();
    startLocalTicker();
    subscribeEvents();
    render();
  }

  async function loadSnapshot() {
    const actorId = document.getElementById("actor-id")?.value || "";
    const query = new URLSearchParams({ actorId });
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/state?${query.toString()}`, {
      headers: { "x-actor-id": actorId }
    });
    state.snapshot = await res.json();
    if (page.role === "interviewer" && state.interviewerDraftIds === null) {
      state.interviewerDraftIds = [...(state.snapshot?.assignedChallengeIds || [])];
    }
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
    const actorId = document.getElementById("actor-id")?.value || "";
    const query = new URLSearchParams({ actorId });
    const stream = new EventSource(`/api/interview-sessions/${page.sessionId}/events?${query.toString()}`);
    ["session.snapshot", "timer.idle", "timer.running", "timer.paused", "timer.ended"].forEach((name) => {
      stream.addEventListener(name, async (event) => {
        const payload = JSON.parse(event.data || "{}");
        if (!state.snapshot || Number(payload.version) >= Number(state.snapshot.version)) {
          state.snapshot = payload;
          if (page.role === "interviewer") {
            state.interviewerDraftIds = [...(payload.assignedChallengeIds || [])];
          }
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
    const snap = state.snapshot || {};
    const remainingMs = renderRemainingMs(snap);
    const progressPct = Number(snap.progressPct || 0);
    const selectedIds = new Set(
      Array.isArray(state.interviewerDraftIds) ? state.interviewerDraftIds : snap.assignedChallengeIds || []
    );

    const assignRows = (state.challenges || [])
      .map((item) => {
        const checked = selectedIds.has(String(item.id)) ? "checked" : "";
        return `<label class="challenge-option">
          <input type="checkbox" data-challenge-id="${escapeHtml(item.id)}" ${checked}>
          <span>#${escapeHtml(item.id)} ${escapeHtml(item.title)}</span>
        </label>`;
      })
      .join("");

    const stateById = new Map((snap.challengeStates || []).map((item) => [String(item.id), item.state]));
    const rows = (state.challenges || [])
      .filter((item) => selectedIds.has(String(item.id)))
      .map((item) => {
        const cState = stateById.get(String(item.id)) || "pending";
        const startDisabled = cState !== "pending" ? "disabled" : "";
        return `<li>
          <span>#${escapeHtml(item.id)} ${escapeHtml(item.title)}</span>
          <strong>${escapeHtml(cState)}</strong>
          <button data-start-id="${escapeHtml(item.id)}" ${startDisabled}>Start</button>
        </li>`;
      })
      .join("");

    const logs = (state.submissions || [])
      .slice()
      .reverse()
      .map(
        (entry) => `<details>
            <summary>${escapeHtml(entry.submittedAt)} | ${escapeHtml(entry.status)} | #${escapeHtml(entry.challengeId)}</summary>
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
      <p><strong>State:</strong> ${escapeHtml(snap.timerState || "loading")} | <strong>Phase:</strong> ${escapeHtml(snap.phase || "-")}</p>
      <div>
        <p><strong>Assign Challenges</strong></p>
        <div id="challenge-assign-list">${assignRows || "<p>No runnable challenges.</p>"}</div>
      </div>
      <button id="save-challenges">Save Challenge List</button>
      <ul class="challenge-states">${rows || "<li>No assigned challenges.</li>"}</ul>
      <div class="progress"><div style="width:${progressPct}%"></div></div>
      <p><strong>Elapsed:</strong> ${formatDuration(snap.elapsedMs || 0)} / <strong>Total:</strong> ${formatDuration(
      snap.totalBudgetMs || 0
    )}</p>
      <div class="editor-tools">
        <button data-action="start">Start Timer</button>
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
    app.querySelectorAll("[data-start-id]").forEach((button) => {
      button.addEventListener("click", () => startChallenge(button.getAttribute("data-start-id")));
    });

    const saveButton = document.getElementById("save-challenges");
    if (saveButton) {
      const locked = snap.phase === "running" || snap.phase === "paused" || snap.phase === "ended";
      saveButton.disabled = locked;
      saveButton.addEventListener("click", saveAssignedChallenges);
    }
    app.querySelectorAll("[data-challenge-id]").forEach((input) => {
      input.addEventListener("change", () => {
        state.interviewerDraftIds = Array.from(document.querySelectorAll("[data-challenge-id]"))
          .filter((entry) => entry.checked)
          .map((entry) => entry.getAttribute("data-challenge-id"));
      });
    });
  }

  function renderInterviewee() {
    const snap = state.snapshot || {};
    const remainingMs = renderRemainingMs(snap);
    const progressPct = Number(snap.progressPct || 0);
    const states = snap.challengeStates || [];
    const viewKey = JSON.stringify({
      states: states.map((entry) => ({ id: entry.id, state: entry.state })),
      challenge: snap.challenge
        ? { id: snap.challenge.id, locked: Boolean(snap.challenge.locked), title: snap.challenge.title }
        : null
    });
    const rows = states
      .map((item) => {
        return `<li>
          <span>#${escapeHtml(item.id)} ${escapeHtml(item.title)}</span>
          <strong>${escapeHtml(item.state)}</strong>
          <button data-open-id="${escapeHtml(item.id)}">Open</button>
        </li>`;
      })
      .join("");

    if (state.intervieweeViewKey !== viewKey) {
      app.innerHTML = `<section class="workspace">
        <div class="workspace-head">
          <h2>Interview Session Home</h2>
          <div id="session-timer">${formatDuration(remainingMs)}</div>
        </div>
        <div class="progress"><div id="session-progress" style="width:${progressPct}%"></div></div>
        <p>Assigned challenges are visible below. Details unlock only after interviewer starts a challenge.</p>
        ${state.lockedNotice ? `<p><strong>${escapeHtml(state.lockedNotice)}</strong></p>` : ""}
        <ul class="challenge-states">${rows || "<li>Waiting for interviewer to assign challenges.</li>"}</ul>
        <section id="challenge-detail">${renderIntervieweeDetail(snap)}</section>
      </section>`;
      state.intervieweeViewKey = viewKey;

      if (snap.challenge?.id && !snap.challenge.locked) {
        mountEditor(snap.challenge.starterCode || "");
      }

      app.querySelectorAll("[data-open-id]").forEach((button) => {
        button.addEventListener("click", () => openChallenge(button.getAttribute("data-open-id")));
      });

      const vim = document.getElementById("vim-toggle");
      if (vim) {
        vim.addEventListener("click", () => {
          state.vimMode = !state.vimMode;
          const current = editorCode();
          mountEditor(current);
        });
      }
      const runTests = document.getElementById("run-tests");
      if (runTests) runTests.addEventListener("click", () => runTestsForActiveChallenge());
      const submit = document.getElementById("submit");
      if (submit) submit.addEventListener("click", () => submitSnapshot());

      const output = document.getElementById("candidate-output");
      if (output) output.textContent = state.intervieweeOutputText;
    }

    const timer = document.getElementById("session-timer");
    if (timer) timer.textContent = formatDuration(remainingMs);
    const progress = document.getElementById("session-progress");
    if (progress) progress.style.width = `${progressPct}%`;
  }

  function renderIntervieweeDetail(snap) {
    const challenge = snap.challenge;
    if (!challenge?.id) return "<p>Open a started challenge to begin coding.</p>";
    if (challenge.locked) return "<p>Waiting for interviewer to start this challenge.</p>";
    return `<article class="markdown" id="session-details">${renderMarkdown(challenge.details || "")}</article>
      <div class="editor-tools">
        <button id="vim-toggle">VIM</button>
        <button id="run-tests">Run Tests</button>
        <button id="submit">Submit</button>
      </div>
      <div id="editor"></div>
      <pre id="candidate-output">Ready.</pre>`;
  }

  async function saveAssignedChallenges() {
    const challengeIds = Array.isArray(state.interviewerDraftIds) ? [...state.interviewerDraftIds] : [];
    const actorId = document.getElementById("actor-id")?.value || "";
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/challenges`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify({ actorId, challengeIds })
    });
    const payload = await res.json();
    if (!res.ok) return alert(payload.error || "Unable to save challenges");
    state.snapshot = payload;
    state.interviewerDraftIds = [...(payload.assignedChallengeIds || [])];
    render();
  }

  async function startChallenge(challengeId) {
    const actorId = document.getElementById("actor-id")?.value || "";
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/challenges/${encodeURIComponent(challengeId)}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify({ actorId })
    });
    const payload = await res.json();
    if (!res.ok) return alert(payload.error || "Unable to start challenge");
    state.snapshot = payload;
    render();
  }

  async function openChallenge(challengeId) {
    const actorId = document.getElementById("actor-id")?.value || "";
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/challenge-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify({ actorId, challengeId })
    });
    const payload = await res.json();
    if (!res.ok) {
      state.lockedNotice = payload.message || payload.error || "Challenge is locked";
      render();
      return;
    }
    state.lockedNotice = "";
    state.snapshot = payload;
    render();
  }

  function mountEditor(code) {
    const host = document.getElementById("editor");
    if (!host) return;
    state.editor?.destroy?.();
    if (window.CodeMirrorApp) {
      state.editor = window.CodeMirrorApp.createEditor({
        element: host,
        value: code || "",
        vimMode: state.vimMode
      });
      return;
    }
    state.editor = null;
    host.innerHTML = `<textarea id="candidate-code-fallback" rows="16">${escapeHtml(code || "")}</textarea>`;
  }

  async function runTestsForActiveChallenge() {
    if (!state.snapshot?.challenge?.id || state.snapshot?.challenge?.locked) return;
    const actorId = document.getElementById("actor-id")?.value || "";
    const code = editorCode();
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/challenge-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify({ actorId, challengeId: state.snapshot.challenge.id, code })
    });
    const payload = await res.json();
    const output = document.getElementById("candidate-output");
    state.intervieweeOutputText = JSON.stringify(payload, null, 2);
    if (output) output.textContent = state.intervieweeOutputText;
  }

  async function submitSnapshot() {
    if (!state.snapshot?.challenge?.id || state.snapshot?.challenge?.locked) return;
    const actorId = state.snapshot?.intervieweeId || "interviewee";
    const body = { actorId, challengeId: state.snapshot.challenge.id, code: editorCode() };
    const res = await fetch(`/api/interview-sessions/${page.sessionId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify(body)
    });
    const payload = await res.json();
    const output = document.getElementById("candidate-output");
    state.intervieweeOutputText = JSON.stringify(payload, null, 2);
    if (output) output.textContent = state.intervieweeOutputText;
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
