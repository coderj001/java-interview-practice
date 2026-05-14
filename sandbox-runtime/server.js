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

function ensureJavaRuntimeCompiled() {
  if (compiled) return;
  fs.mkdirSync(classesDir, { recursive: true });
  const javaFiles = collectJavaFiles(path.join(repoRoot, "src", "main", "java"));
  const compileResult = spawnSync("javac", ["-d", classesDir, ...javaFiles], { cwd: repoRoot, encoding: "utf8" });
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

  return {
    ok: true,
    value: { challengeId, sourceCode, timeoutMs: finalTimeoutMs, memoryMb: finalMemoryMb, networkMode, traceId }
  };
}

function evaluate({ challengeId, sourceCode, timeoutMs, memoryMb }, runJava = spawnSync) {
  ensureJavaRuntimeCompiled();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "java-sandbox-job-"));
  const sourceFile = path.join(tempDir, "Solution.java");
  fs.writeFileSync(sourceFile, sourceCode, "utf8");
  try {
    const result = runJava(
      "java",
      ["-Xmx" + String(memoryMb) + "m", "-cp", classesDir, "com.interview.platform.web.ChallengeWorkbenchCli", "evaluate", challengeId, sourceFile],
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

      const result = evaluate(validated.value);
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

module.exports = { createServer, validateRequest, evaluate };
