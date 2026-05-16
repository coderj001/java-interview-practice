package com.interview.platform.ai;

public interface HintService {
    String nextHint(InterviewRequest request, HintLevel currentLevel);
}
