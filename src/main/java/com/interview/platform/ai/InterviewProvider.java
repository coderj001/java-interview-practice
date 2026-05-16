package com.interview.platform.ai;

public interface InterviewProvider {
    String name();

    ReviewResponse review(InterviewRequest request);

    FollowUpResponse followUpQuestions(InterviewRequest request);

    String hint(InterviewRequest request, HintLevel level);
}
