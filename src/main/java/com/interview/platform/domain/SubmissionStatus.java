package com.interview.platform.domain;

public enum SubmissionStatus {
    DRAFT,
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED;

    public boolean canTransitionTo(SubmissionStatus target) {
        return switch (this) {
            case DRAFT -> target == QUEUED;
            case QUEUED -> target == RUNNING || target == FAILED;
            case RUNNING -> target == COMPLETED || target == FAILED;
            case COMPLETED, FAILED -> false;
        };
    }
}
