const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-coder-v2";

async function reviewCode(challenge, code, apiKey, model = DEFAULT_MODEL) {
  const content = await callOpenRouter({
    apiKey,
    model,
    systemPrompt: "You are a Java interview coach. Return only JSON with keys: qualityAssessment, improvementSuggestion, followUpQuestions.",
    userPrompt: buildReviewPrompt(challenge, code)
  });
  const parsed = parseStructuredJson(content);
  return {
    qualityAssessment: asString(parsed.qualityAssessment),
    improvementSuggestion: asString(parsed.improvementSuggestion),
    followUpQuestions: asStringArray(parsed.followUpQuestions)
  };
}

async function hintCode(challenge, code, level, apiKey, model = DEFAULT_MODEL) {
  const normalizedLevel = normalizeLevel(level);
  const content = await callOpenRouter({
    apiKey,
    model,
    systemPrompt: "You are a Java interview coach. Return only JSON with key: hint.",
    userPrompt: buildHintPrompt(challenge, code, normalizedLevel)
  });
  const parsed = parseStructuredJson(content);
  return {
    level: normalizedLevel,
    nextLevel: normalizedLevel === "4" ? "max" : String(Number.parseInt(normalizedLevel, 10) + 1),
    hint: asString(parsed.hint)
  };
}

function buildReviewPrompt(challenge, code) {
  return [
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
  return [
    `Hint level: ${level} (1 = subtle, 4 = very specific).`,
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

async function callOpenRouter({ apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = payload.choices && payload.choices[0] && payload.choices[0].message
    ? payload.choices[0].message.content
    : "";

  if (!text) {
    throw new Error("OpenRouter response did not include text content.");
  }
  return text;
}

function parseStructuredJson(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const matched = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (!matched) {
      throw new Error("Unable to parse OpenRouter response as JSON.");
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
  DEFAULT_MODEL
};
