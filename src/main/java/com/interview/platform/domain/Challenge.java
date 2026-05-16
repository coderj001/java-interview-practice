package com.interview.platform.domain;

import java.util.List;

public record Challenge(
        String id,
        String title,
        Difficulty difficulty,
        String prompt,
        String explanation,
        List<String> resources
) {
}
