package com.interview.platform.web;

import com.interview.platform.ai.FollowUpResponse;
import com.interview.platform.ai.HintLevel;
import com.interview.platform.ai.InterviewProvider;
import com.interview.platform.ai.InterviewRequest;
import com.interview.platform.ai.ProgressiveHintService;
import com.interview.platform.ai.ProviderRegistry;
import com.interview.platform.ai.ReviewResponse;
import com.interview.platform.catalog.ChallengeCatalog;
import com.interview.platform.catalog.StaticChallengeCatalog;
import com.interview.platform.domain.Challenge;
import com.interview.platform.domain.Submission;
import com.interview.platform.domain.SubmissionStatus;
import com.interview.platform.service.EvaluationResult;
import com.interview.platform.service.EvaluationService;
import com.interview.platform.service.LeaderboardEntry;
import com.interview.platform.service.LeaderboardService;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;

public class ChallengeWorkbench {
    private final ChallengeCatalog catalog;
    private final EvaluationService evaluationService;
    private final LeaderboardService leaderboardService;
    private final ProviderRegistry providerRegistry;
    private final AtomicLong submissionSequence;
    private final Map<String, ChallengeDefinition> definitions;

    public ChallengeWorkbench() {
        this(new StaticChallengeCatalog(), new EvaluationService(), new LeaderboardService(), new ProviderRegistry());
    }

    ChallengeWorkbench(
            ChallengeCatalog catalog,
            EvaluationService evaluationService,
            LeaderboardService leaderboardService,
            ProviderRegistry providerRegistry
    ) {
        this.catalog = Objects.requireNonNull(catalog);
        this.evaluationService = Objects.requireNonNull(evaluationService);
        this.leaderboardService = Objects.requireNonNull(leaderboardService);
        this.providerRegistry = Objects.requireNonNull(providerRegistry);
        this.submissionSequence = new AtomicLong(1);
        this.definitions = buildDefinitions(catalog.listAll());
    }

    public List<ChallengeView> listChallenges() {
        return definitions.values().stream()
                .map(ChallengeDefinition::view)
                .toList();
    }

    public ChallengeView challenge(String challengeId) {
        return requireDefinition(challengeId).view();
    }

    public EvaluationResponse runTests(String challengeId, String sourceCode) {
        return evaluate(challengeId, sourceCode);
    }

    public SubmissionResponse submit(String challengeId, String userId, String sourceCode) {
        String normalizedUserId = normalizeUser(userId);
        Submission submission = new Submission(nextSubmissionId(), challengeId, normalizedUserId, sourceCode, SubmissionStatus.DRAFT);
        submission = submission.transition(SubmissionStatus.QUEUED);
        submission = submission.transition(SubmissionStatus.RUNNING);

        EvaluationResponse evaluation = evaluate(challengeId, sourceCode);
        submission = submission.transition(evaluation.accepted() ? SubmissionStatus.COMPLETED : SubmissionStatus.FAILED);
        if (evaluation.accepted()) {
            leaderboardService.updateScore(normalizedUserId, evaluation.correctnessPoints());
        }
        return new SubmissionResponse(submission.id(), submission.status().name(), evaluation);
    }

    public ReviewView review(String challengeId, String providerName, String sourceCode) {
        ChallengeDefinition definition = requireDefinition(challengeId);
        InterviewProvider provider = providerRegistry.get(providerName);
        InterviewRequest request = new InterviewRequest(challengeId, sourceCode, definition.challenge.title());
        ReviewResponse review = provider.review(request);
        FollowUpResponse followUp = provider.followUpQuestions(request);
        return new ReviewView(provider.name(), review.qualityAssessment(), review.improvementSuggestion(), followUp.questions());
    }

    public HintView nextHint(String challengeId, String providerName, String sourceCode, String currentLevel) {
        ChallengeDefinition definition = requireDefinition(challengeId);
        InterviewProvider provider = providerRegistry.get(providerName);
        InterviewRequest request = new InterviewRequest(challengeId, sourceCode, definition.challenge.title());

        HintLevel deliveredLevel;
        String hint;
        if (currentLevel == null || currentLevel.isBlank()) {
            deliveredLevel = HintLevel.NUDGE;
            hint = provider.hint(request, deliveredLevel);
        } else {
            HintLevel previous = HintLevel.valueOf(currentLevel.toUpperCase(Locale.ROOT));
            deliveredLevel = previous.next();
            hint = new ProgressiveHintService(provider).nextHint(request, previous);
        }

        return new HintView(provider.name(), deliveredLevel.name(), deliveredLevel.next().name(), hint);
    }

    public List<LeaderboardEntry> leaderboard() {
        return leaderboardService.top();
    }

    private EvaluationResponse evaluate(String challengeId, String sourceCode) {
        ChallengeDefinition definition = requireDefinition(challengeId);
        if (sourceCode == null || sourceCode.isBlank()) {
            return new EvaluationResponse(
                    false,
                    "COMPILATION_ERROR",
                    "Source code is required.",
                    definition.tests.size(),
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    List.of("Paste or edit a `Solution` class before running tests.")
            );
        }

        CompilationArtifact artifact = compile(sourceCode);
        if (!artifact.success()) {
            return new EvaluationResponse(
                    false,
                    "COMPILATION_ERROR",
                    "Source code did not compile.",
                    definition.tests.size(),
                    0,
                    0,
                    0,
                    estimateMemoryBytes(sourceCode),
                    List.of(),
                    artifact.diagnostics()
            );
        }

        List<TestOutcome> outcomes = new ArrayList<>();
        long startedAt = System.nanoTime();
        try (URLClassLoader classLoader = new URLClassLoader(new URL[]{artifact.outputDirectory().toUri().toURL()})) {
            Class<?> solutionClass = Class.forName("Solution", true, classLoader);
            Object solution = solutionClass.getDeclaredConstructor().newInstance();
            for (ChallengeTest test : definition.tests) {
                outcomes.add(test.execute(solutionClass, solution));
            }
        } catch (ReflectiveOperationException | IOException e) {
            return new EvaluationResponse(
                    false,
                    "RUNTIME_ERROR",
                    "Compiled, but the solution could not be executed.",
                    definition.tests.size(),
                    0,
                    0,
                    0,
                    estimateMemoryBytes(sourceCode),
                    List.of(),
                    List.of(e.getMessage())
            );
        } finally {
            artifact.cleanup();
        }

        long durationMillis = Math.max(1L, (System.nanoTime() - startedAt) / 1_000_000L);
        int passedTests = (int) outcomes.stream().filter(TestOutcome::passed).count();
        EvaluationResult evaluation = evaluationService.evaluate(
                definition.tests.size(),
                passedTests,
                durationMillis,
                estimateMemoryBytes(sourceCode)
        );
        String status = evaluation.passed() ? "PASSED" : "PARTIAL";
        String message = evaluation.passed()
                ? "All tests passed. Ready to submit."
                : "Some tests still fail. Review the cases below.";
        return new EvaluationResponse(
                true,
                status,
                message,
                evaluation.totalTests(),
                evaluation.passedTests(),
                evaluation.score().correctnessPoints(),
                evaluation.score().executionTimeMillis(),
                evaluation.score().memoryBytes(),
                outcomes,
                List.of()
        );
    }

    private Map<String, ChallengeDefinition> buildDefinitions(List<Challenge> challenges) {
        Map<String, Challenge> challengeById = new LinkedHashMap<>();
        for (Challenge challenge : challenges) {
            challengeById.put(challenge.id(), challenge);
        }

        Map<String, ChallengeDefinition> challengeDefinitions = new LinkedHashMap<>();
        challengeDefinitions.put("1", beginnerDefinition(challengeById.get("1")));
        challengeDefinitions.put("4", intermediateDefinition(challengeById.get("4")));
        challengeDefinitions.put("24", advancedDefinition(challengeById.get("24")));
        return challengeDefinitions.entrySet().stream()
                .sorted(Comparator.comparing(e -> difficultyRank(e.getValue().challenge.difficulty().name())))
                .collect(LinkedHashMap::new, (map, entry) -> map.put(entry.getKey(), entry.getValue()), LinkedHashMap::putAll);
    }

    private ChallengeDefinition beginnerDefinition(Challenge challenge) {
        return new ChallengeDefinition(
                challenge,
                "Implement `solve(int a, int b)` and return the sum of the two inputs.",
                """
                public class Solution {
                    public int solve(int a, int b) {
                        return a + b;
                    }
                }
                """,
                "Method contract: `int solve(int a, int b)`",
                List.of(
                        "Input: (2, 3) -> Output: 5",
                        "Input: (-4, 10) -> Output: 6",
                        "Input: (0, 0) -> Output: 0"
                ),
                List.of(
                        test("adds positive numbers", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int.class, int.class}, new Object[]{2, 3}, 5)),
                        test("handles negative values", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int.class, int.class}, new Object[]{-4, 10}, 6)),
                        test("handles zero values", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int.class, int.class}, new Object[]{0, 0}, 0))
                )
        );
    }

    private ChallengeDefinition intermediateDefinition(Challenge challenge) {
        return new ChallengeDefinition(
                challenge,
                "Implement `solve(int[][] edges, int start, int target)` and return the shortest hop count in an undirected graph. Return `-1` when no path exists.",
                """
                public class Solution {
                    public int solve(int[][] edges, int start, int target) {
                        return -1;
                    }
                }
                """,
                "Method contract: `int solve(int[][] edges, int start, int target)`",
                List.of(
                        "Edges: [[1,2],[2,3],[3,4]], start=1, target=4 -> 3",
                        "Edges: [[1,2],[1,3],[2,4],[3,4]], start=2, target=3 -> 2",
                        "Edges: [[1,2]], start=1, target=3 -> -1"
                ),
                List.of(
                        test("finds a direct shortest path", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int[][].class, int.class, int.class},
                                        new Object[]{new int[][]{{1, 2}, {2, 3}, {3, 4}}, 1, 4}, 3)),
                        test("handles branching paths", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int[][].class, int.class, int.class},
                                        new Object[]{new int[][]{{1, 2}, {1, 3}, {2, 4}, {3, 4}}, 2, 3}, 2)),
                        test("returns -1 when disconnected", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int[][].class, int.class, int.class},
                                        new Object[]{new int[][]{{1, 2}}, 1, 3}, -1))
                )
        );
    }

    private ChallengeDefinition advancedDefinition(Challenge challenge) {
        return new ChallengeDefinition(
                challenge,
                "Implement `solve(int[] values)` and return the length of the longest strictly increasing subsequence.",
                """
                public class Solution {
                    public int solve(int[] values) {
                        return 0;
                    }
                }
                """,
                "Method contract: `int solve(int[] values)`",
                List.of(
                        "Input: [10, 9, 2, 5, 3, 7, 101, 18] -> Output: 4",
                        "Input: [0, 1, 0, 3, 2, 3] -> Output: 4",
                        "Input: [7, 7, 7, 7] -> Output: 1"
                ),
                List.of(
                        test("solves classic LIS input", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int[].class},
                                        new Object[]{new int[]{10, 9, 2, 5, 3, 7, 101, 18}}, 4)),
                        test("handles repeated pivots", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int[].class},
                                        new Object[]{new int[]{0, 1, 0, 3, 2, 3}}, 4)),
                        test("counts equal values once", (type, instance) ->
                                expectIntCall(type, instance, new Class<?>[]{int[].class},
                                        new Object[]{new int[]{7, 7, 7, 7}}, 1))
                )
        );
    }

    private static int difficultyRank(String difficulty) {
        return switch (difficulty) {
            case "BEGINNER" -> 0;
            case "INTERMEDIATE" -> 1;
            default -> 2;
        };
    }

    private static ChallengeTest test(String name, TestExecutor executor) {
        return (type, instance) -> {
            try {
                return executor.run(type, instance);
            } catch (InvocationTargetException e) {
                Throwable cause = e.getCause() == null ? e : e.getCause();
                return new TestOutcome(name, false, "Runtime exception: " + cause.getMessage());
            } catch (ReflectiveOperationException e) {
                return new TestOutcome(name, false, "Reflection error: " + e.getMessage());
            }
        };
    }

    private static TestOutcome expectIntCall(
            Class<?> type,
            Object instance,
            Class<?>[] parameterTypes,
            Object[] args,
            int expected
    ) throws ReflectiveOperationException {
        int actual = (int) type.getMethod("solve", parameterTypes).invoke(instance, args);
        boolean passed = actual == expected;
        String detail = passed
                ? "Expected " + expected + " and received " + actual + "."
                : "Expected " + expected + " but received " + actual + ".";
        return new TestOutcome("solve", passed, detail);
    }

    private static CompilationArtifact compile(String sourceCode) {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            return CompilationArtifact.failed(List.of("Java compiler not available. Run this project with a JDK."));
        }

        try {
            Path outputDirectory = Files.createTempDirectory("java-interview-practice");
            Path sourceFile = outputDirectory.resolve("Solution.java");
            Files.writeString(sourceFile, sourceCode, StandardCharsets.UTF_8);

            DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
            try (StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
                Iterable<? extends JavaFileObject> units = fileManager.getJavaFileObjects(sourceFile.toFile());
                List<String> options = List.of("-d", outputDirectory.toString());
                Boolean success = compiler.getTask(null, fileManager, diagnostics, options, null, units).call();
                if (Boolean.TRUE.equals(success)) {
                    return CompilationArtifact.success(outputDirectory);
                }
            }

            List<String> messages = diagnostics.getDiagnostics().stream()
                    .map(ChallengeWorkbench::formatDiagnostic)
                    .toList();
            deleteRecursively(outputDirectory);
            return CompilationArtifact.failed(messages);
        } catch (IOException e) {
            return CompilationArtifact.failed(List.of("Could not compile source: " + e.getMessage()));
        }
    }

    private static String formatDiagnostic(Diagnostic<? extends JavaFileObject> diagnostic) {
        return "line " + diagnostic.getLineNumber() + ": " + diagnostic.getMessage(Locale.ROOT);
    }

    private static void deleteRecursively(Path root) {
        if (root == null || !Files.exists(root)) {
            return;
        }
        try {
            Files.walk(root)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                            // Best-effort cleanup for temp compilation directories.
                        }
                    });
        } catch (IOException ignored) {
            // Best-effort cleanup for temp compilation directories.
        }
    }

    private static long estimateMemoryBytes(String sourceCode) {
        return Math.max(4096L, sourceCode.getBytes(StandardCharsets.UTF_8).length * 32L);
    }

    private ChallengeDefinition requireDefinition(String challengeId) {
        ChallengeDefinition definition = definitions.get(challengeId);
        if (definition == null) {
            throw new IllegalArgumentException("Unknown challenge: " + challengeId);
        }
        return definition;
    }

    private String nextSubmissionId() {
        return "submission-" + submissionSequence.getAndIncrement();
    }

    private static String normalizeUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return "guest";
        }
        return userId.trim();
    }

    @FunctionalInterface
    private interface TestExecutor {
        TestOutcome run(Class<?> type, Object instance) throws ReflectiveOperationException;
    }

    @FunctionalInterface
    private interface ChallengeTest {
        TestOutcome execute(Class<?> type, Object instance);
    }

    private record ChallengeDefinition(
            Challenge challenge,
            String prompt,
            String starterCode,
            String methodContract,
            List<String> examples,
            List<ChallengeTest> tests
    ) {
        private ChallengeView view() {
            return new ChallengeView(
                    challenge.id(),
                    challenge.title(),
                    challenge.difficulty().name(),
                    prompt,
                    challenge.explanation(),
                    challenge.resources(),
                    starterCode,
                    methodContract,
                    examples
            );
        }
    }

    private record CompilationArtifact(Path outputDirectory, List<String> diagnostics) {
        private static CompilationArtifact success(Path outputDirectory) {
            return new CompilationArtifact(outputDirectory, List.of());
        }

        private static CompilationArtifact failed(List<String> diagnostics) {
            return new CompilationArtifact(null, diagnostics);
        }

        private boolean success() {
            return outputDirectory != null;
        }

        private void cleanup() {
            deleteRecursively(outputDirectory);
        }
    }

    public record ChallengeView(
            String id,
            String title,
            String difficulty,
            String prompt,
            String explanation,
            List<String> resources,
            String starterCode,
            String methodContract,
            List<String> examples
    ) {
    }

    public record TestOutcome(String name, boolean passed, String detail) {
    }

    public record EvaluationResponse(
            boolean accepted,
            String status,
            String message,
            int totalTests,
            int passedTests,
            int correctnessPoints,
            long executionTimeMillis,
            long memoryBytes,
            List<TestOutcome> tests,
            List<String> diagnostics
    ) {
    }

    public record SubmissionResponse(String submissionId, String status, EvaluationResponse evaluation) {
    }

    public record ReviewView(
            String provider,
            String qualityAssessment,
            String improvementSuggestion,
            List<String> followUpQuestions
    ) {
    }

    public record HintView(String provider, String level, String nextLevel, String hint) {
    }
}
