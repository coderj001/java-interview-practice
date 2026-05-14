const fs = require("node:fs");
const path = require("node:path");
const gemini = require("./ai-gemini");
const openrouter = require("./ai-openrouter");
const { loadChallengesFile, repoRoot } = require("./challenge-loader");

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const openrouterApiKey = process.env.OPENROUTER_API_KEY || "";
const openrouterModel = process.env.OPENROUTER_MODEL || openrouter.DEFAULT_MODEL;

const availableProviders = [];
if (geminiApiKey) availableProviders.push("gemini");
if (openrouterApiKey) availableProviders.push("openrouter");

const defaultSystemPrompt = "You are a Java interview coach. Be accurate and concise.";

function loadSystemPrompt() {
  const { systemPrompt } = loadChallengesFile();
  const promptPath = path.join(repoRoot, systemPrompt || "system-prompt.md");
  try {
    return fs.readFileSync(promptPath, "utf8").trim();
  } catch (_error) {
    process.stderr.write(`[warn] system prompt not found at ${promptPath}, using default\n`);
    return defaultSystemPrompt;
  }
}

async function reviewCode(providerName, challenge, code) {
  assertProviderAvailable(providerName);
  const systemPrompt = loadSystemPrompt();
  if (providerName === "gemini") {
    return gemini.reviewCode(challenge, code, geminiApiKey, systemPrompt);
  }
  if (providerName === "openrouter") {
    return openrouter.reviewCode(challenge, code, openrouterApiKey, openrouterModel, systemPrompt);
  }
  throw new Error(`Provider not available: ${providerName}`);
}

async function hintCode(providerName, challenge, code, currentLevel) {
  assertProviderAvailable(providerName);
  const maxLevel = String(challenge?.rules?.maxHintLevel || 4);
  const level = normalizeLevel(currentLevel, maxLevel);
  const nextLevel = Number(level) >= Number(maxLevel) ? "max" : String(Number(level) + 1);
  const systemPrompt = loadSystemPrompt();

  if (providerName === "gemini") {
    const response = await gemini.hintCode(challenge, code, level, geminiApiKey, systemPrompt);
    return { level, nextLevel, hint: response.hint };
  }
  if (providerName === "openrouter") {
    const response = await openrouter.hintCode(challenge, code, level, openrouterApiKey, openrouterModel, systemPrompt);
    return { level, nextLevel, hint: response.hint };
  }
  throw new Error(`Provider not available: ${providerName}`);
}

function assertProviderAvailable(providerName) {
  if (!availableProviders.includes(providerName)) {
    throw new Error(`Provider not available: ${providerName}`);
  }
}

function normalizeLevel(currentLevel, maxLevel) {
  const n = Number.parseInt(String(currentLevel || "1"), 10);
  if (!Number.isFinite(n) || n < 1) return "1";
  if (n > Number(maxLevel)) return String(maxLevel);
  return String(n);
}

module.exports = {
  availableProviders,
  reviewCode,
  hintCode,
  loadSystemPrompt
};
