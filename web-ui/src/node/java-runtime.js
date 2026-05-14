const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const runtimeDir = path.join(repoRoot, ".java-runtime");
const classesDir = path.join(runtimeDir, "classes");
let compiled = false;

function ensureJavaRuntimeCompiled() {
  if (compiled) {
    return;
  }

  fs.mkdirSync(classesDir, { recursive: true });
  const javaFiles = collectJavaFiles(path.join(repoRoot, "src", "main", "java"));
  const compileResult = spawnSync("javac", ["-d", classesDir, ...javaFiles], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (compileResult.status !== 0) {
    throw new Error(`javac failed: ${compileResult.stderr || compileResult.stdout}`);
  }

  compiled = true;
}

function listChallenges() {
  ensureJavaRuntimeCompiled();
  const output = runCli(["list"]);
  return JSON.parse(output).challenges;
}

function evaluateChallenge(challengeId, sourceCode) {
  ensureJavaRuntimeCompiled();
  return JSON.parse(runWithSource(["evaluate", challengeId], sourceCode));
}

function runWithSource(args, sourceCode) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "java-interview-practice-"));
  const sourceFile = path.join(tempDir, "Solution.java");
  fs.writeFileSync(sourceFile, sourceCode, "utf8");
  try {
    return runCli([...args, sourceFile]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function runCli(args) {
  const result = spawnSync("java", ["-cp", classesDir, "com.interview.platform.web.ChallengeWorkbenchCli", ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Java runtime command failed.");
  }

  return result.stdout;
}

function collectJavaFiles(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJavaFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".java")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

module.exports = {
  ensureJavaRuntimeCompiled,
  listChallenges,
  evaluateChallenge
};
