const http = require("node:http");
const crypto = require("node:crypto");
const { challengeById } = require("./challenge-loader");

const sandboxUrl = new URL(process.env.SANDBOX_RUNTIME_URL || "http://127.0.0.1:7070");

function ensureJavaRuntimeCompiled() {
  // Kept for compatibility with server startup flow; sandbox service owns compilation.
}

async function evaluateChallenge(challengeId, sourceCode, options = {}) {
  const challenge = challengeById(challengeId);
  const sandboxProfile = challenge && challenge.sandboxProfile && typeof challenge.sandboxProfile === "object"
    ? challenge.sandboxProfile
    : {};
  const payload = {
    challengeId: String(challengeId),
    sourceCode: String(sourceCode || ""),
    timeoutMs: Number.parseInt(process.env.SANDBOX_JOB_TIMEOUT_MS || "3000", 10),
    memoryMb: Number.parseInt(process.env.SANDBOX_JOB_MEMORY_MB || "128", 10),
    networkModeRequested: options.networkModeRequested || "",
    traceId: options.traceId || crypto.randomUUID(),
    mode: String(sandboxProfile.mode || ""),
    sandboxProfile
  };

  const response = await postJson(new URL("/execute", sandboxUrl), payload);
  if (response.statusCode !== 200) {
    const message = response.body && response.body.error
      ? `Sandbox policy/execution rejected request: ${response.body.error}`
      : "Sandbox runtime request failed.";
    throw new Error(message);
  }
  return response.body.evaluation;
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        protocol: url.protocol,
        headers: {
          "Content-Type": "application/json"
        },
        timeout: Number.parseInt(process.env.SANDBOX_HTTP_TIMEOUT_MS || "5000", 10)
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const raw = Buffer.concat(chunks).toString("utf8");
            const body = raw ? JSON.parse(raw) : {};
            resolve({ statusCode: res.statusCode || 500, body });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on("error", (error) => reject(error));
    req.on("timeout", () => {
      req.destroy(new Error("Sandbox HTTP request timed out."));
    });

    req.end(JSON.stringify(payload));
  });
}

module.exports = { ensureJavaRuntimeCompiled, evaluateChallenge };
