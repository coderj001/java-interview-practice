package com.interview.platform.domain;

public record Submission(
        String id,
        String challengeId,
        String userId,
        String sourceCode,
        SubmissionStatus status
) {
    public Submission transition(SubmissionStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new IllegalStateException("Invalid transition from " + status + " to " + target);
        }
        return new Submission(id, challengeId, userId, sourceCode, target);
    }
}
