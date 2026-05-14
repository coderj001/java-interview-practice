const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

async function reviewCode(challenge, code, apiKey) {
  const prompt = buildReviewPrompt(challenge, code);
  const content = await callGemini(prompt, apiKey);
  const parsed = parseStructuredJson(content);
  return {
    qualityAssessment: asString(parsed.qualityAssessment),
    improvementSuggestion: asString(parsed.improvementSuggestion),
    followUpQuestions: asStringArray(parsed.followUpQuestions)
  };
}

async function hintCode(challenge, code, level, apiKey) {
  const prompt = buildHintPrompt(challenge, code, level);
  const content = await callGemini(prompt, apiKey);
  const parsed = parseStructuredJson(content);
  const normalizedLevel = normalizeLevel(level);
  return {
    level: normalizedLevel,
    nextLevel: normalizedLevel === "4" ? "max" : String(Number.parseInt(normalizedLevel, 10) + 1),
    hint: asString(parsed.hint)
  };
}

function buildReviewPrompt(challenge, code) {
  return [
    "You are a Java interview coach.",
    "Return only JSON with keys: qualityAssessment, improvementSuggestion, followUpQuestions.",
    "followUpQuestions must be an array of strings.",
    "",
    "Challenge title:",
    "```text",
    challenge.title || "",
    "```",
    "",
    "Method contract:",
    "```text",
    challenge.methodContract || "",
    "```",
    "",
    "Prompt description:",
    "```text",
    challenge.prompt || "",
    "```",
    "",
    "User code:",
    "```java",
    code || "",
    "```"
  ].join("\n");
}

function buildHintPrompt(challenge, code, level) {
  const normalizedLevel = normalizeLevel(level);
  return [
    "You are a Java interview coach.",
    "Return only JSON with key: hint.",
    "Give a concise hint appropriate for the requested level.",
    `Hint level: ${normalizedLevel} (1 = subtle, 4 = very specific).`,
    "",
    "Challenge title:",
    "```text",
    challenge.title || "",
    "```",
    "",
    "Method contract:",
    "```text",
    challenge.methodContract || "",
    "```",
    "",
    "Prompt description:",
    "```text",
    challenge.prompt || "",
    "```",
    "",
    "User code:",
    "```java",
    code || "",
    "```"
  ].join("\n");
}

async function callGemini(prompt, apiKey) {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = payload.candidates && payload.candidates[0] && payload.candidates[0].content
    && payload.candidates[0].content.parts && payload.candidates[0].content.parts[0]
    ? payload.candidates[0].content.parts[0].text
    : "";

  if (!text) {
    throw new Error("Gemini response did not include text content.");
  }

  return text;
}

function parseStructuredJson(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const matched = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (!matched) {
      throw new Error("Unable to parse Gemini response as JSON.");
    }
    return JSON.parse(matched[1]);
  }
}

function normalizeLevel(level) {
  const value = String(level || "").trim();
  return ["1", "2", "3", "4"].includes(value) ? value : "1";
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string");
}

module.exports = {
  reviewCode,
  hintCode,
  buildReviewPrompt,
  buildHintPrompt
};
