const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const watchedPaths = [
  "server.js",
  "package.json",
  "views",
  "public",
  path.join("src", "node"),
  path.join("..", "src", "main", "java"),
  path.join("..", "challenges")
];

let child = null;
let stopping = false;
let snapshot = createSnapshot();
let restartTimer = null;

startServer();

const interval = setInterval(() => {
  if (stopping) {
    return;
  }
  const nextSnapshot = createSnapshot();
  if (hasSnapshotChanged(snapshot, nextSnapshot)) {
    snapshot = nextSnapshot;
    scheduleRestart();
  }
}, 750);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function scheduleRestart() {
  if (restartTimer) {
    clearTimeout(restartTimer);
  }
  restartTimer = setTimeout(() => {
    restartTimer = null;
    process.stdout.write("\n[dev] change detected, restarting server\n");
    restartServer();
  }, 150);
}

function startServer() {
  child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    child = null;
    if (!stopping && signal == null && code !== 0) {
      process.stdout.write(`\n[dev] server exited with code ${code}\n`);
    }
  });
}

function restartServer() {
  if (!child) {
    startServer();
    return;
  }

  const currentChild = child;
  currentChild.once("exit", () => {
    if (!stopping) {
      startServer();
    }
  });
  currentChild.kill("SIGTERM");
}

function shutdown() {
  stopping = true;
  clearInterval(interval);
  if (restartTimer) {
    clearTimeout(restartTimer);
  }
  if (!child) {
    process.exit(0);
    return;
  }
  child.once("exit", () => process.exit(0));
  child.kill("SIGTERM");
}

function createSnapshot() {
  const entries = new Map();
  for (const watchedPath of watchedPaths) {
    const absolutePath = path.join(rootDir, watchedPath);
    collectEntries(absolutePath, entries);
  }
  return entries;
}

function collectEntries(targetPath, entries) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    const children = fs.readdirSync(targetPath).sort();
    for (const childName of children) {
      collectEntries(path.join(targetPath, childName), entries);
    }
    return;
  }

  entries.set(targetPath, `${stats.size}:${stats.mtimeMs}`);
}

function hasSnapshotChanged(previous, next) {
  if (previous.size !== next.size) {
    return true;
  }

  for (const [filePath, metadata] of previous) {
    if (next.get(filePath) !== metadata) {
      return true;
    }
  }

  return false;
}
