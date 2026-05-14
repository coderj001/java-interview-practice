package com.interview.platform.service;

import com.interview.platform.domain.Score;

public class EvaluationService {
    private static final int MAX_POINTS = 100;

    public EvaluationResult evaluate(int totalTests, int passedTests, long executionTimeMillis, long memoryBytes) {
        if (totalTests <= 0) {
            throw new IllegalArgumentException("totalTests must be positive");
        }
        if (passedTests < 0 || passedTests > totalTests) {
            throw new IllegalArgumentException("passedTests out of range");
        }

        int correctness = (int) Math.floor((passedTests * (double) MAX_POINTS) / totalTests);
        Score score = new Score(correctness, executionTimeMillis, memoryBytes);
        return new EvaluationResult(totalTests, passedTests, score);
    }
}
