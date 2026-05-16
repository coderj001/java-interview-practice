const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-coder-v2";
const MAX_TEST_CONTEXT_CHARS = 4000;

async function reviewCode(challenge, code, apiKey, model = DEFAULT_MODEL, systemPrompt) {
  const content = await callOpenRouter({
    apiKey,
    model,
    systemPrompt: `${systemPrompt || "You are a Java interview coach."} Return only JSON with keys: qualityAssessment, improvementSuggestion, followUpQuestions.`,
    userPrompt: buildReviewPrompt(challenge, code)
  });
  const parsed = parseStructuredJson(content);
  return {
    qualityAssessment: asString(parsed.qualityAssessment),
    improvementSuggestion: asString(parsed.improvementSuggestion),
    followUpQuestions: asStringArray(parsed.followUpQuestions)
  };
}

async function hintCode(challenge, code, level, apiKey, model = DEFAULT_MODEL, systemPrompt) {
  const content = await callOpenRouter({
    apiKey,
    model,
    systemPrompt: `${systemPrompt || "You are a Java interview coach."} Return only JSON with key: hint.`,
    userPrompt: buildHintPrompt(challenge, code, level)
  });
  const parsed = parseStructuredJson(content);
  return { hint: asString(parsed.hint) };
}

function buildReviewPrompt(challenge, code) {
  const testsContext = buildTestsContext(challenge);
  return [
    "Challenge title:", "```text", challenge.title || "", "```", "",
    "Method contract:", "```text", challenge.methodContract || "", "```", "",
    "Challenge details:", "```text", challenge.details || "", "```", "",
    ...(testsContext ? ["Visible tests:", "```json", testsContext, "```", ""] : []),
    "User code:", "```java", code || "", "```"
  ].join("\n");
}

function buildHintPrompt(challenge, code, level) {
  const hintContext = Array.isArray(challenge.hints) ? challenge.hints.join("\n- ") : "";
  const guidanceStyle = challenge?.rules?.guidanceStyle || "socratic";
  const testsContext = buildTestsContext(challenge);
  return [
    `Hint level: ${level}.`,
    `Guidance style: ${guidanceStyle}.`,
    `Challenge hints:\n- ${hintContext}`,
    "",
    "Challenge title:", "```text", challenge.title || "", "```", "",
    "Method contract:", "```text", challenge.methodContract || "", "```", "",
    "Challenge details:", "```text", challenge.details || "", "```", "",
    ...(testsContext ? ["Visible tests:", "```json", testsContext, "```", ""] : []),
    "User code:", "```java", code || "", "```"
  ].join("\n");
}

async function callOpenRouter({ apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] })
  });

  if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`);

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("OpenRouter response did not include text content.");
  return text;
}

function parseStructuredJson(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const matched = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (!matched) throw new Error("Unable to parse OpenRouter response as JSON.");
    return JSON.parse(matched[1]);
  }
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function buildTestsContext(challenge) {
  const tests = Array.isArray(challenge?.testCases) ? challenge.testCases : [];
  if (!tests.length) return "";
  const json = JSON.stringify(tests, null, 2);
  if (json.length <= MAX_TEST_CONTEXT_CHARS) return json;
  return `${json.slice(0, MAX_TEST_CONTEXT_CHARS)}\n/* truncated: test context too large */`;
}

module.exports = { reviewCode, hintCode, DEFAULT_MODEL };
