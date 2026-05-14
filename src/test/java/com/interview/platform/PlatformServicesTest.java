package com.interview.platform;

import com.interview.platform.ai.HintLevel;
import com.interview.platform.ai.InterviewRequest;
import com.interview.platform.ai.ProgressiveHintService;
import com.interview.platform.ai.ProviderRegistry;
import com.interview.platform.service.EvaluationResult;
import com.interview.platform.service.EvaluationService;
import com.interview.platform.service.LeaderboardEntry;
import com.interview.platform.service.LeaderboardService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlatformServicesTest {

    @Test
    void scoringIsDeterministic() {
        EvaluationService service = new EvaluationService();
        EvaluationResult resultA = service.evaluate(10, 7, 120, 10_000);
        EvaluationResult resultB = service.evaluate(10, 7, 130, 11_000);
        assertEquals(resultA.score().correctnessPoints(), resultB.score().correctnessPoints());
        assertEquals(70, resultA.score().correctnessPoints());
    }

    @Test
    void leaderboardKeepsBestScoreOnly() {
        LeaderboardService leaderboard = new LeaderboardService();
        leaderboard.updateScore("alice", 60);
        leaderboard.updateScore("bob", 90);
        leaderboard.updateScore("alice", 80);
        leaderboard.updateScore("alice", 75);

        List<LeaderboardEntry> top = leaderboard.top();
        assertEquals("bob", top.get(0).userId());
        assertEquals(90, top.get(0).bestScore());
        assertEquals("alice", top.get(1).userId());
        assertEquals(80, top.get(1).bestScore());
    }

    @Test
    void hintProgressesAcrossFourLevels() {
        ProviderRegistry registry = new ProviderRegistry();
        ProgressiveHintService hints = new ProgressiveHintService(registry.get("gemini"));
        InterviewRequest request = new InterviewRequest("24", "class Solution {}", "LIS");

        String h1 = hints.nextHint(request, HintLevel.NUDGE);
        String h2 = hints.nextHint(request, HintLevel.DIRECTION);
        String h3 = hints.nextHint(request, HintLevel.STRATEGY);

        assertTrue(h1.contains("DIRECTION"));
        assertTrue(h2.contains("STRATEGY"));
        assertTrue(h3.contains("SOLUTION_OUTLINE"));
    }
}
