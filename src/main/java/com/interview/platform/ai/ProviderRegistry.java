package com.interview.platform.ai;

import java.util.HashMap;
import java.util.Map;

public class ProviderRegistry {
    private final Map<String, InterviewProvider> providers = new HashMap<>();

    public ProviderRegistry() {
        register(new SimpleInterviewProvider("gemini"));
        register(new SimpleInterviewProvider("openai"));
        register(new SimpleInterviewProvider("claude"));
    }

    public void register(InterviewProvider provider) {
        providers.put(provider.name().toLowerCase(), provider);
    }

    public InterviewProvider get(String providerName) {
        InterviewProvider provider = providers.get(providerName.toLowerCase());
        if (provider == null) {
            throw new IllegalArgumentException("Unsupported provider: " + providerName);
        }
        return provider;
    }
}
