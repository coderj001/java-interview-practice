package com.interview.platform.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LeaderboardService {
    private final Map<String, Integer> bestScores = new HashMap<>();

    public void updateScore(String userId, int score) {
        bestScores.merge(userId, score, Math::max);
    }

    public List<LeaderboardEntry> top() {
        List<LeaderboardEntry> entries = new ArrayList<>();
        for (Map.Entry<String, Integer> e : bestScores.entrySet()) {
            entries.add(new LeaderboardEntry(e.getKey(), e.getValue()));
        }
        entries.sort(Comparator.comparingInt(LeaderboardEntry::bestScore).reversed()
                .thenComparing(LeaderboardEntry::userId));
        return entries;
    }
}
