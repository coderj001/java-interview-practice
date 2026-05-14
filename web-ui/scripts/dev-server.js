const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const watchedPaths = ["server.js", "package.json", "views", "public", path.join("src", "node"), path.join("src", "browser"), path.join("..", "src", "main", "java"), path.join("..", "challenges.json"), path.join("..", "system-prompt.md")];
let child = null; let stopping = false; let snapshot = createSnapshot(); let restartTimer = null;
startServer();
const interval = setInterval(() => { if (stopping) return; const nextSnapshot = createSnapshot(); if (hasSnapshotChanged(snapshot, nextSnapshot)) { snapshot = nextSnapshot; scheduleRestart(); } }, 750);
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
function scheduleRestart() { if (restartTimer) clearTimeout(restartTimer); restartTimer = setTimeout(() => { restartTimer = null; process.stdout.write("\n[dev] change detected, restarting server\n"); restartServer(); }, 150); }
function startServer() { child = spawn(process.execPath, ["server.js"], { cwd: rootDir, stdio: "inherit" }); child.on("exit", (code, signal) => { child = null; if (!stopping && signal == null && code !== 0) process.stdout.write(`\n[dev] server exited with code ${code}\n`); }); }
function restartServer() { if (!child) return startServer(); const c = child; c.once("exit", () => { if (!stopping) startServer(); }); c.kill("SIGTERM"); }
function shutdown() { stopping = true; clearInterval(interval); if (restartTimer) clearTimeout(restartTimer); if (!child) return process.exit(0); child.once("exit", () => process.exit(0)); child.kill("SIGTERM"); }
function createSnapshot() { const entries = new Map(); for (const watchedPath of watchedPaths) collectEntries(path.join(rootDir, watchedPath), entries); return entries; }
function collectEntries(targetPath, entries) { if (!fs.existsSync(targetPath)) return; const stats = fs.statSync(targetPath); if (stats.isDirectory()) { for (const childName of fs.readdirSync(targetPath).sort()) collectEntries(path.join(targetPath, childName), entries); return; } entries.set(targetPath, `${stats.size}:${stats.mtimeMs}`); }
function hasSnapshotChanged(previous, next) { if (previous.size !== next.size) return true; for (const [filePath, metadata] of previous) if (next.get(filePath) !== metadata) return true; return false; }
