package com.interview.platform.web;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChallengeWorkbenchTest {

    @Test
    void runTestsPassesForCorrectBeginnerSolution() {
        ChallengeWorkbench workbench = new ChallengeWorkbench();

        ChallengeWorkbench.EvaluationResponse response = workbench.runTests("1", """
                public class Solution {
                    public int solve(int a, int b) {
                        return a + b;
                    }
                }
                """);

        assertTrue(response.accepted());
        assertEquals("PASSED", response.status());
        assertEquals(3, response.passedTests());
        assertEquals(100, response.correctnessPoints());
    }

    @Test
    void compileErrorsAreReported() {
        ChallengeWorkbench workbench = new ChallengeWorkbench();

        ChallengeWorkbench.EvaluationResponse response = workbench.runTests("24", """
                public class Solution {
                    public int solve(int[] values) {
                        return values.length
                    }
                }
                """);

        assertEquals("COMPILATION_ERROR", response.status());
        assertTrue(response.diagnostics().stream().anyMatch(line -> line.contains("';' expected")));
    }

    @Test
    void submitUpdatesLeaderboardWithBestScore() {
        ChallengeWorkbench workbench = new ChallengeWorkbench();

        workbench.submit("1", "raju", """
                public class Solution {
                    public int solve(int a, int b) {
                        return 0;
                    }
                }
                """);

        workbench.submit("1", "raju", """
                public class Solution {
                    public int solve(int a, int b) {
                        return a + b;
                    }
                }
                """);

        assertEquals(1, workbench.leaderboard().size());
        assertEquals("raju", workbench.leaderboard().get(0).userId());
        assertEquals(100, workbench.leaderboard().get(0).bestScore());
    }
}
