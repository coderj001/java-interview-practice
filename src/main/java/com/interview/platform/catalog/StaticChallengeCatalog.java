package com.interview.platform.catalog;

import com.interview.platform.domain.Challenge;
import com.interview.platform.domain.Difficulty;

import java.util.List;

public class StaticChallengeCatalog implements ChallengeCatalog {
    @Override
    public List<Challenge> listAll() {
        return List.of(
                new Challenge("1", "Sum of Two Numbers", Difficulty.BEGINNER, "Add two numbers.", "Use integer addition.", List.of("https://docs.oracle.com/javase/tutorial/java/nutsandbolts/")),
                new Challenge("4", "Concurrent Graph BFS Queries", Difficulty.INTERMEDIATE, "Handle parallel BFS queries.", "Use thread-safe data access.", List.of("https://docs.oracle.com/javase/tutorial/essential/concurrency/")),
                new Challenge("24", "Longest Increasing Subsequence", Difficulty.ADVANCED, "Compute LIS length.", "Use dynamic programming.", List.of("https://en.wikipedia.org/wiki/Longest_increasing_subsequence"))
        );
    }
}
