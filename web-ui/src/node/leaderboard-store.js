function createLeaderboardStore() {
  const bestScores = new Map();

  return {
    record(userId, score) {
      const current = bestScores.get(userId) || 0;
      bestScores.set(userId, Math.max(current, score));
    },
    top() {
      return Array.from(bestScores.entries())
        .map(([userId, bestScore]) => ({ userId, bestScore }))
        .sort((left, right) => {
          if (right.bestScore !== left.bestScore) {
            return right.bestScore - left.bestScore;
          }
          return left.userId.localeCompare(right.userId);
        });
    }
  };
}

module.exports = {
  createLeaderboardStore
};
