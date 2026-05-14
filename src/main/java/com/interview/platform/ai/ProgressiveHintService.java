package com.interview.platform.ai;

public class ProgressiveHintService implements HintService {
    private final InterviewProvider provider;

    public ProgressiveHintService(InterviewProvider provider) {
        this.provider = provider;
    }

    @Override
    public String nextHint(InterviewRequest request, HintLevel currentLevel) {
        HintLevel targetLevel = currentLevel.next();
        return provider.hint(request, targetLevel);
    }
}
