package com.interview.platform.web;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public final class ChallengeWorkbenchCli {
    private ChallengeWorkbenchCli() {
    }

    public static void main(String[] args) throws IOException {
        ChallengeWorkbench workbench = new ChallengeWorkbench();
        if (args.length == 0) {
            throw new IllegalArgumentException("Expected a command.");
        }

        String command = args[0];
        switch (command) {
            case "list" -> System.out.print(listJson(workbench.listChallenges()));
            case "evaluate" -> {
                requireArgs(args, 3);
                String sourceCode = Files.readString(Path.of(args[2]));
                System.out.print(evaluationJson(workbench.runTests(args[1], sourceCode)));
            }
            case "review" -> {
                requireArgs(args, 4);
                String sourceCode = Files.readString(Path.of(args[3]));
                System.out.print(reviewJson(workbench.review(args[1], args[2], sourceCode)));
            }
            case "hint" -> {
                requireArgs(args, 5);
                String sourceCode = Files.readString(Path.of(args[4]));
                String currentLevel = "-".equals(args[3]) ? "" : args[3];
                System.out.print(hintJson(workbench.nextHint(args[1], args[2], sourceCode, currentLevel)));
            }
            default -> throw new IllegalArgumentException("Unknown command: " + command);
        }
    }

    private static void requireArgs(String[] args, int expectedLength) {
        if (args.length < expectedLength) {
            throw new IllegalArgumentException("Command requires more arguments.");
        }
    }

    private static String listJson(List<ChallengeWorkbench.ChallengeView> challenges) {
        StringBuilder builder = new StringBuilder();
        builder.append("{\"challenges\":[");
        for (int i = 0; i < challenges.size(); i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(challengeJson(challenges.get(i)));
        }
        builder.append("]}");
        return builder.toString();
    }

    private static String challengeJson(ChallengeWorkbench.ChallengeView challenge) {
        return "{"
                + "\"id\":" + quote(challenge.id()) + ","
                + "\"title\":" + quote(challenge.title()) + ","
                + "\"difficulty\":" + quote(challenge.difficulty()) + ","
                + "\"prompt\":" + quote(challenge.prompt()) + ","
                + "\"explanation\":" + quote(challenge.explanation()) + ","
                + "\"starterCode\":" + quote(challenge.starterCode()) + ","
                + "\"methodContract\":" + quote(challenge.methodContract()) + ","
                + "\"resources\":" + stringArray(challenge.resources()) + ","
                + "\"examples\":" + stringArray(challenge.examples())
                + "}";
    }

    private static String evaluationJson(ChallengeWorkbench.EvaluationResponse response) {
        StringBuilder builder = new StringBuilder();
        builder.append('{')
                .append("\"accepted\":").append(response.accepted()).append(',')
                .append("\"status\":").append(quote(response.status())).append(',')
                .append("\"message\":").append(quote(response.message())).append(',')
                .append("\"totalTests\":").append(response.totalTests()).append(',')
                .append("\"passedTests\":").append(response.passedTests()).append(',')
                .append("\"correctnessPoints\":").append(response.correctnessPoints()).append(',')
                .append("\"executionTimeMillis\":").append(response.executionTimeMillis()).append(',')
                .append("\"memoryBytes\":").append(response.memoryBytes()).append(',')
                .append("\"tests\":[");
        for (int i = 0; i < response.tests().size(); i++) {
            if (i > 0) {
                builder.append(',');
            }
            ChallengeWorkbench.TestOutcome test = response.tests().get(i);
            builder.append('{')
                    .append("\"name\":").append(quote(test.name())).append(',')
                    .append("\"passed\":").append(test.passed()).append(',')
                    .append("\"detail\":").append(quote(test.detail()))
                    .append('}');
        }
        builder.append("],\"diagnostics\":").append(stringArray(response.diagnostics())).append('}');
        return builder.toString();
    }

    private static String reviewJson(ChallengeWorkbench.ReviewView response) {
        return "{"
                + "\"provider\":" + quote(response.provider()) + ","
                + "\"qualityAssessment\":" + quote(response.qualityAssessment()) + ","
                + "\"improvementSuggestion\":" + quote(response.improvementSuggestion()) + ","
                + "\"followUpQuestions\":" + stringArray(response.followUpQuestions())
                + "}";
    }

    private static String hintJson(ChallengeWorkbench.HintView response) {
        return "{"
                + "\"provider\":" + quote(response.provider()) + ","
                + "\"level\":" + quote(response.level()) + ","
                + "\"nextLevel\":" + quote(response.nextLevel()) + ","
                + "\"hint\":" + quote(response.hint())
                + "}";
    }

    private static String stringArray(List<String> values) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(quote(values.get(i)));
        }
        return builder.append(']').toString();
    }

    private static String quote(String value) {
        String escaped = value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
        return "\"" + escaped + "\"";
    }
}
