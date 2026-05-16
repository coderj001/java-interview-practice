package com.interview.platform.ai;

public enum HintLevel {
    NUDGE,
    DIRECTION,
    STRATEGY,
    SOLUTION_OUTLINE;

    public HintLevel next() {
        int nextOrdinal = Math.min(values().length - 1, ordinal() + 1);
        return values()[nextOrdinal];
    }
}
