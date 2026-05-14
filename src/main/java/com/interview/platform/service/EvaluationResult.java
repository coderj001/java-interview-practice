package com.interview.platform.service;

import com.interview.platform.domain.Score;

public record EvaluationResult(int totalTests, int passedTests, Score score) {
    public boolean passed() {
        return totalTests > 0 && totalTests == passedTests;
    }
}
