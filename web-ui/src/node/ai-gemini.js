const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

async function reviewCode(challenge, code, apiKey, systemPrompt) {
  const prompt = buildReviewPrompt(challenge, code, systemPrompt);
  const content = await callGemini(prompt, apiKey);
  const parsed = parseStructuredJson(content);
  return {
    qualityAssessment: asString(parsed.qualityAssessment),
    improvementSuggestion: asString(parsed.improvementSuggestion),
    followUpQuestions: asStringArray(parsed.followUpQuestions)
  };
}

async function hintCode(challenge, code, level, apiKey, systemPrompt) {
  const prompt = buildHintPrompt(challenge, code, level, systemPrompt);
  const content = await callGemini(prompt, apiKey);
  const parsed = parseStructuredJson(content);
  return { hint: asString(parsed.hint) };
}

function buildReviewPrompt(challenge, code, systemPrompt) {
  return [
    systemPrompt || "You are a Java interview coach.",
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
    "Challenge details:",
    "```text",
    challenge.details || "",
    "```",
    "",
    "User code:",
    "```java",
    code || "",
    "```"
  ].join("\n");
}

function buildHintPrompt(challenge, code, level, systemPrompt) {
  const hintContext = Array.isArray(challenge.hints) ? challenge.hints.join("\n- ") : "";
  const guidanceStyle = challenge?.rules?.guidanceStyle || "socratic";
  return [
    systemPrompt || "You are a Java interview coach.",
    "Return only JSON with key: hint.",
    "Give a concise hint appropriate for the requested level.",
    `Hint level: ${level}.`,
    `Guidance style: ${guidanceStyle}.`,
    `Challenge hints:\n- ${hintContext}`,
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
    "Challenge details:",
    "```text",
    challenge.details || "",
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
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini response did not include text content.");
  return text;
}

function parseStructuredJson(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const matched = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (!matched) throw new Error("Unable to parse Gemini response as JSON.");
    return JSON.parse(matched[1]);
  }
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

module.exports = {
  reviewCode,
  hintCode,
  buildReviewPrompt,
  buildHintPrompt
};
