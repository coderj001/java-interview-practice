const gemini = require("./ai-gemini");
const openrouter = require("./ai-openrouter");

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const openrouterApiKey = process.env.OPENROUTER_API_KEY || "";
const openrouterModel = process.env.OPENROUTER_MODEL || openrouter.DEFAULT_MODEL;

const availableProviders = [];
if (geminiApiKey) {
  availableProviders.push("gemini");
}
if (openrouterApiKey) {
  availableProviders.push("openrouter");
}

async function reviewCode(providerName, challenge, code) {
  assertProviderAvailable(providerName);
  if (providerName === "gemini") {
    return gemini.reviewCode(challenge, code, geminiApiKey);
  }
  if (providerName === "openrouter") {
    return openrouter.reviewCode(challenge, code, openrouterApiKey, openrouterModel);
  }
  throw new Error(`Provider not available: ${providerName}`);
}

async function hintCode(providerName, challenge, code, currentLevel) {
  assertProviderAvailable(providerName);
  const level = normalizeLevel(currentLevel);
  const nextLevel = level === "4" ? "max" : String(Number.parseInt(level, 10) + 1);

  if (providerName === "gemini") {
    const response = await gemini.hintCode(challenge, code, level, geminiApiKey);
    return { level, nextLevel, hint: response.hint };
  }
  if (providerName === "openrouter") {
    const response = await openrouter.hintCode(challenge, code, level, openrouterApiKey, openrouterModel);
    return { level, nextLevel, hint: response.hint };
  }
  throw new Error(`Provider not available: ${providerName}`);
}

function assertProviderAvailable(providerName) {
  if (!availableProviders.includes(providerName)) {
    throw new Error(`Provider not available: ${providerName}`);
  }
}

function normalizeLevel(currentLevel) {
  const value = String(currentLevel || "").trim();
  return ["1", "2", "3", "4"].includes(value) ? value : "1";
}

module.exports = {
  availableProviders,
  reviewCode,
  hintCode
};
