const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function loadServerModule(envOverrides) {
  const original = {
    SANDBOX_DEFAULT_NETWORK_MODE: process.env.SANDBOX_DEFAULT_NETWORK_MODE,
    SANDBOX_ALLOW_NETWORK_OVERRIDE: process.env.SANDBOX_ALLOW_NETWORK_OVERRIDE,
    SANDBOX_ALLOWED_NETWORK_MODES: process.env.SANDBOX_ALLOWED_NETWORK_MODES,
    SANDBOX_MAX_TIMEOUT_MS: process.env.SANDBOX_MAX_TIMEOUT_MS,
    SANDBOX_MAX_MEMORY_MB: process.env.SANDBOX_MAX_MEMORY_MB
  };

  Object.assign(process.env, envOverrides);
  const modulePath = path.resolve(__dirname, "..", "..", "sandbox-runtime", "server.js");
  delete require.cache[modulePath];
  const loaded = require(modulePath);

  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  return loaded;
}

test("default policy denies network override", () => {
  const { validateRequest } = loadServerModule({
    SANDBOX_DEFAULT_NETWORK_MODE: "none",
    SANDBOX_ALLOW_NETWORK_OVERRIDE: "false",
    SANDBOX_ALLOWED_NETWORK_MODES: "bridge",
    SANDBOX_MAX_TIMEOUT_MS: "5000",
    SANDBOX_MAX_MEMORY_MB: "256"
  });

  const result = validateRequest({
    challengeId: "1",
    sourceCode: "public class Solution { public int solve(int a, int b){ return a+b; } }",
    timeoutMs: 1000,
    memoryMb: 128,
    networkModeRequested: "bridge",
    traceId: "t-1"
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "POLICY_REJECTED");
});

test("policy can allow configured network override", () => {
  const { validateRequest } = loadServerModule({
    SANDBOX_DEFAULT_NETWORK_MODE: "none",
    SANDBOX_ALLOW_NETWORK_OVERRIDE: "true",
    SANDBOX_ALLOWED_NETWORK_MODES: "bridge,host",
    SANDBOX_MAX_TIMEOUT_MS: "5000",
    SANDBOX_MAX_MEMORY_MB: "256"
  });

  const result = validateRequest({
    challengeId: "1",
    sourceCode: "public class Solution { public int solve(int a, int b){ return a+b; } }",
    timeoutMs: 1000,
    memoryMb: 128,
    networkModeRequested: "bridge",
    traceId: "t-2"
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.networkMode, "bridge");
});

test("policy enforces timeout and memory caps", () => {
  const { validateRequest } = loadServerModule({
    SANDBOX_DEFAULT_NETWORK_MODE: "none",
    SANDBOX_ALLOW_NETWORK_OVERRIDE: "false",
    SANDBOX_ALLOWED_NETWORK_MODES: "bridge",
    SANDBOX_MAX_TIMEOUT_MS: "1000",
    SANDBOX_MAX_MEMORY_MB: "64"
  });

  const timeoutResult = validateRequest({
    challengeId: "1",
    sourceCode: "public class Solution { public int solve(int a, int b){ return a+b; } }",
    timeoutMs: 2000,
    memoryMb: 32,
    traceId: "t-3"
  });
  assert.equal(timeoutResult.ok, false);
  assert.equal(timeoutResult.code, "POLICY_REJECTED");

  const memoryResult = validateRequest({
    challengeId: "1",
    sourceCode: "public class Solution { public int solve(int a, int b){ return a+b; } }",
    timeoutMs: 900,
    memoryMb: 128,
    traceId: "t-4"
  });
  assert.equal(memoryResult.ok, false);
  assert.equal(memoryResult.code, "POLICY_REJECTED");
});

test("sandbox evaluate cleans up per-job temp source artifacts", () => {
  const { evaluate } = loadServerModule({});
  const before = fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith("java-sandbox-job-"));
  const fakeRunner = () => ({ status: 0, stdout: JSON.stringify({ accepted: true }) });

  const result = evaluate(
    { challengeId: "1", sourceCode: "public class Solution {}", timeoutMs: 1000, memoryMb: 64 },
    fakeRunner
  );

  const after = fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith("java-sandbox-job-"));
  assert.equal(result.ok, true);
  assert.deepEqual(after, before);
});
