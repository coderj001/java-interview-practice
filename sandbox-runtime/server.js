const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");

const repoRoot = path.resolve(__dirname, "..");
const classesDir = path.join(repoRoot, ".java-runtime", "classes");

const policy = {
  defaultNetworkMode: process.env.SANDBOX_DEFAULT_NETWORK_MODE || "none",
  allowNetworkOverride: String(process.env.SANDBOX_ALLOW_NETWORK_OVERRIDE || "false").toLowerCase() === "true",
  allowedNetworkModes: new Set(
    String(process.env.SANDBOX_ALLOWED_NETWORK_MODES || "bridge")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  ),
  maxTimeoutMs: Number.parseInt(process.env.SANDBOX_MAX_TIMEOUT_MS || "5000", 10),
  maxMemoryMb: Number.parseInt(process.env.SANDBOX_MAX_MEMORY_MB || "256", 10)
};

let compiled = false;
let challengeIndex = null;

function loadChallengeIndex() {
  if (challengeIndex) return challengeIndex;
  const file = path.join(repoRoot, "challenges.json");
  if (!fs.existsSync(file)) {
    challengeIndex = new Map();
    return challengeIndex;
  }
  const root = JSON.parse(fs.readFileSync(file, "utf8"));
  const map = new Map();
  for (const c of root.challenges || []) {
    map.set(String(c.id), c);
  }
  challengeIndex = map;
  return challengeIndex;
}

function ensureJavaRuntimeCompiled() {
  if (compiled) return;
  fs.mkdirSync(classesDir, { recursive: true });
  const javaFiles = collectJavaFiles(path.join(repoRoot, "src", "main", "java"));
  if (javaFiles.length === 0) {
    throw new Error("No Java runtime sources found under src/main/java. Reflective evaluation is unavailable.");
  }
  const compileResult = spawnSync("javac", ["-cp", "/app/libs/*", "-d", classesDir, ...javaFiles], { cwd: repoRoot, encoding: "utf8" });
  if (compileResult.status !== 0) {
    throw new Error(`javac failed: ${compileResult.stderr || compileResult.stdout}`);
  }
  compiled = true;
}

function collectJavaFiles(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) files.push(...collectJavaFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".java")) files.push(fullPath);
  }
  return files.sort();
}

function validateRequest(payload) {
  const challengeId = String(payload.challengeId || "").trim();
  const sourceCode = String(payload.sourceCode || "");
  const timeoutMs = Number.parseInt(String(payload.timeoutMs || ""), 10);
  const memoryMb = Number.parseInt(String(payload.memoryMb || ""), 10);
  const requested = String(payload.networkModeRequested || "").trim();
  const traceId = String(payload.traceId || crypto.randomUUID());

  if (!challengeId) return { ok: false, code: "VALIDATION_ERROR", error: "challengeId is required." };
  if (!sourceCode.trim()) return { ok: false, code: "VALIDATION_ERROR", error: "sourceCode is required." };

  const finalTimeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : 3000;
  const finalMemoryMb = Number.isFinite(memoryMb) ? memoryMb : 128;

  if (finalTimeoutMs > policy.maxTimeoutMs) {
    return { ok: false, code: "POLICY_REJECTED", error: `timeoutMs exceeds max policy (${policy.maxTimeoutMs}).` };
  }
  if (finalMemoryMb > policy.maxMemoryMb) {
    return { ok: false, code: "POLICY_REJECTED", error: `memoryMb exceeds max policy (${policy.maxMemoryMb}).` };
  }

  let networkMode = policy.defaultNetworkMode;
  if (requested && requested !== policy.defaultNetworkMode) {
    if (!policy.allowNetworkOverride || !policy.allowedNetworkModes.has(requested)) {
      return { ok: false, code: "POLICY_REJECTED", error: `Requested network mode '${requested}' is not permitted.` };
    }
    networkMode = requested;
  }

  const challengeMeta = loadChallengeIndex().get(challengeId);
  const resolvedMode = String(payload.mode || (challengeMeta && challengeMeta.sandboxProfile && challengeMeta.sandboxProfile.mode) || "").trim();
  const resolvedSandboxProfile = {
    ...((challengeMeta && challengeMeta.sandboxProfile) || {}),
    ...(payload.sandboxProfile || {})
  };

  return {
    ok: true,
    value: {
      challengeId,
      sourceCode,
      timeoutMs: finalTimeoutMs,
      memoryMb: finalMemoryMb,
      networkMode,
      traceId,
      mode: resolvedMode,
      sandboxProfile: resolvedSandboxProfile
    }
  };
}

function extractJavaClassName(code) {
  const match = String(code || "").match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
  return match ? match[1] : null;
}

function parseJUnitSummary(xmlPath) {
  if (!fs.existsSync(xmlPath)) {
    return { ok: false, code: "RUNTIME_ERROR", error: `JUnit report not found: ${xmlPath}` };
  }
  const xml = fs.readFileSync(xmlPath, "utf8");
  const tests = Number((xml.match(/tests="(\d+)"/) || [])[1] || 0);
  const failures = Number((xml.match(/failures="(\d+)"/) || [])[1] || 0);
  const errors = Number((xml.match(/errors="(\d+)"/) || [])[1] || 0);
  const skipped = Number((xml.match(/skipped="(\d+)"/) || [])[1] || 0);
  const failed = failures + errors;
  const passed = Math.max(0, tests - failed - skipped);
  const correctnessPoints = tests > 0 ? Math.round((passed / tests) * 100) : 0;
  const testItems = [];
  const testcaseRegex = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>|<testcase\b([^>]*)\/>/g;
  let match;
  while ((match = testcaseRegex.exec(xml)) !== null) {
    const attrs = (match[1] || match[3] || "");
    const body = match[2] || "";
    const nameMatch = attrs.match(/\bname="([^"]+)"/);
    const testName = nameMatch ? nameMatch[1] : "unknown";
    const failureMatch = body.match(/<(failure|error)\b[^>]*message="([^"]*)"/);
    testItems.push({
      name: testName,
      passed: !failureMatch,
      detail: failureMatch ? failureMatch[2] : "Passed"
    });
  }
  return {
    ok: true,
    evaluation: {
      accepted: failed === 0 && tests > 0,
      correctnessPoints,
      passedTests: passed,
      totalTests: tests,
      tests: testItems
    }
  };
}

function findJUnitXmlReport(reportsDir) {
  if (!fs.existsSync(reportsDir)) return null;
  const files = fs.readdirSync(reportsDir).filter((f) => f.endsWith(".xml")).sort();
  return files.length > 0 ? path.join(reportsDir, files[0]) : null;
}

function evaluate({ challengeId, sourceCode, timeoutMs, memoryMb }, runJava = spawnSync) {
  ensureJavaRuntimeCompiled();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "java-sandbox-job-"));
  const sourceFile = path.join(tempDir, "Solution.java");
  fs.writeFileSync(sourceFile, sourceCode, "utf8");
  try {
    const result = runJava(
      "java",
      ["-Xmx" + String(memoryMb) + "m", "-cp", classesDir + ":/app/libs/*", "com.interview.platform.web.ChallengeWorkbenchCli", "evaluate", challengeId, sourceFile],
      { cwd: repoRoot, encoding: "utf8", timeout: timeoutMs }
    );
    if (result.error && result.error.code === "ETIMEDOUT") {
      return { ok: false, code: "TIMEOUT", error: `Execution timed out after ${timeoutMs}ms.` };
    }
    if (result.status !== 0) {
      return { ok: false, code: "RUNTIME_ERROR", error: result.stderr || result.stdout || "Java runtime command failed." };
    }
    return { ok: true, evaluation: JSON.parse(result.stdout) };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function evaluateCustomTest({ sourceCode, timeoutMs, memoryMb, sandboxProfile }, runJava = spawnSync) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "java-sandbox-job-"));
  const sourceFile = path.join(tempDir, "Solution.java");
  const harnessCode = String(sandboxProfile.harnessCode || "");
  const runner = String(sandboxProfile.runner || "raw");
  const harnessClassName = String(sandboxProfile.harnessClassName || extractJavaClassName(harnessCode) || "").trim();
  if (!harnessCode.trim()) return { ok: false, code: "VALIDATION_ERROR", error: "sandboxProfile.harnessCode is required for custom_test mode." };
  if (!harnessClassName) return { ok: false, code: "VALIDATION_ERROR", error: "Unable to determine custom harness class name." };

  const harnessFile = path.join(tempDir, `${harnessClassName}.java`);
  fs.writeFileSync(sourceFile, sourceCode, "utf8");
  fs.writeFileSync(harnessFile, harnessCode, "utf8");

  try {
    const compileResult = spawnSync("javac", ["-cp", ".:/app/libs/*", "Solution.java", `${harnessClassName}.java`], {
      cwd: tempDir,
      encoding: "utf8",
      timeout: timeoutMs
    });
    if (compileResult.error && compileResult.error.code === "ETIMEDOUT") {
      return { ok: false, code: "TIMEOUT", error: `Compilation timed out after ${timeoutMs}ms.` };
    }
    if (compileResult.status !== 0) {
      return { ok: false, code: "COMPILE_ERROR", error: compileResult.stderr || compileResult.stdout || "Compilation failed." };
    }

    if (runner === "raw") {
      const rawResult = runJava("java", ["-Xmx" + String(memoryMb) + "m", "-cp", ".:/app/libs/*", harnessClassName], {
        cwd: tempDir,
        encoding: "utf8",
        timeout: timeoutMs
      });
      if (rawResult.error && rawResult.error.code === "ETIMEDOUT") {
        return { ok: false, code: "TIMEOUT", error: `Execution timed out after ${timeoutMs}ms.` };
      }
      if (rawResult.status !== 0) {
        return { ok: false, code: "RUNTIME_ERROR", error: rawResult.stderr || rawResult.stdout || "Raw harness command failed." };
      }
      return { ok: true, evaluation: JSON.parse(rawResult.stdout) };
    }

    if (runner === "junit") {
      const reportsDir = path.join(tempDir, "reports");
      fs.mkdirSync(reportsDir, { recursive: true });
      const junitResult = runJava(
        "java",
        [
          "-Xmx" + String(memoryMb) + "m",
          "-cp",
          ".:/app/libs/*",
          "org.junit.platform.console.ConsoleLauncher",
          "--select-class",
          harnessClassName,
          "--reports-dir",
          "reports"
        ],
        { cwd: tempDir, encoding: "utf8", timeout: timeoutMs }
      );
      if (junitResult.error && junitResult.error.code === "ETIMEDOUT") {
        return { ok: false, code: "TIMEOUT", error: `Execution timed out after ${timeoutMs}ms.` };
      }
      const reportPath = findJUnitXmlReport(reportsDir);
      if (!reportPath) {
        return { ok: false, code: "RUNTIME_ERROR", error: "JUnit did not generate XML reports." };
      }
      const summary = parseJUnitSummary(reportPath);
      if (!summary.ok) return summary;
      return summary;
    }

    return { ok: false, code: "VALIDATION_ERROR", error: `Unsupported custom_test runner '${runner}'.` };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, { ok: true });
    }
    if (req.method !== "POST" || req.url !== "/execute") {
      return sendJson(res, 404, { error: "Not found" });
    }

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      let payload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch (_error) {
        return sendJson(res, 400, { code: "VALIDATION_ERROR", error: "Invalid JSON payload." });
      }

      const validated = validateRequest(payload);
      if (!validated.ok) {
        return sendJson(res, 400, validated);
      }

      const mode = String(validated.value.mode || validated.value.sandboxProfile.mode || "").trim();
      let result;
      try {
        result = mode === "custom_test" ? evaluateCustomTest(validated.value) : evaluate(validated.value);
      } catch (error) {
        result = { ok: false, code: "RUNTIME_ERROR", error: String(error && error.message ? error.message : error) };
      }
      if (!result.ok) {
        return sendJson(res, 400, { ...result, traceId: validated.value.traceId, networkMode: validated.value.networkMode });
      }

      return sendJson(res, 200, {
        traceId: validated.value.traceId,
        networkMode: validated.value.networkMode,
        evaluation: result.evaluation
      });
    });
  });
}

if (require.main === module) {
  const port = Number.parseInt(process.env.SANDBOX_PORT || "7070", 10);
  createServer().listen(port, () => {
    process.stdout.write(`Sandbox runtime listening on ${port}\n`);
  });
}

module.exports = { createServer, validateRequest, evaluate, evaluateCustomTest, extractJavaClassName, parseJUnitSummary, findJUnitXmlReport };
