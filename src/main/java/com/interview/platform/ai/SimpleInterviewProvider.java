package com.interview.platform.ai;

import java.util.List;

public class SimpleInterviewProvider implements InterviewProvider {
    private final String name;

    public SimpleInterviewProvider(String name) {
        this.name = name;
    }

    @Override
    public String name() {
        return name;
    }

    @Override
    public ReviewResponse review(InterviewRequest request) {
        return new ReviewResponse("Readable baseline solution", "Add edge-case handling and explain complexity.");
    }

    @Override
    public FollowUpResponse followUpQuestions(InterviewRequest request) {
        return new FollowUpResponse(List.of("What is your time complexity?", "How would this scale for large input?"));
    }

    @Override
    public String hint(InterviewRequest request, HintLevel level) {
        return "[" + level + "] Consider input constraints and algorithm choice for " + request.challengeId();
    }
}
