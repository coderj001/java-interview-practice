const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

function normalizeChallengeId(value) {
  return normalizeSegment(value, "challengeId");
}

function normalizeUserId(value) {
  return normalizeSegment(value, "userId");
}

function normalizeSegment(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  if (!SAFE_SEGMENT.test(normalized)) {
    throw new Error(`${fieldName} may only contain letters, numbers, underscores, and hyphens.`);
  }
  return normalized;
}

module.exports = {
  normalizeChallengeId,
  normalizeUserId
};
