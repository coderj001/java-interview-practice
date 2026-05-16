package com.interview.platform.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.interview.platform.domain.Difficulty;
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
import java.io.InputStream;
import java.lang.reflect.Array;
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
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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
        this.definitions = loadDefinitions();
    }

    public List<ChallengeView> listChallenges() {
        return definitions.values().stream().map(ChallengeDefinition::view).toList();
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
            return new EvaluationResponse(false, "COMPILATION_ERROR", "Source code is required.", definition.tests.size(), 0, 0, 0, 0, List.of(), List.of("Paste or edit a `Solution` class before running tests."));
        }
        if (definition.unsupportedReason != null) {
            return new EvaluationResponse(false, "UNSUPPORTED_REFLECTIVE_SHAPE", definition.unsupportedReason, definition.tests.size(), 0, 0, 0, estimateMemoryBytes(sourceCode), List.of(), List.of(definition.unsupportedReason));
        }

        CompilationArtifact artifact = compile(sourceCode);
        if (!artifact.success()) {
            return new EvaluationResponse(false, "COMPILATION_ERROR", "Source code did not compile.", definition.tests.size(), 0, 0, 0, estimateMemoryBytes(sourceCode), List.of(), artifact.diagnostics());
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
            return new EvaluationResponse(false, "RUNTIME_ERROR", "Compiled, but the solution could not be executed.", definition.tests.size(), 0, 0, 0, estimateMemoryBytes(sourceCode), List.of(), List.of(e.getMessage()));
        } finally {
            artifact.cleanup();
        }

        long durationMillis = Math.max(1L, (System.nanoTime() - startedAt) / 1_000_000L);
        int passedTests = (int) outcomes.stream().filter(TestOutcome::passed).count();
        EvaluationResult evaluation = evaluationService.evaluate(definition.tests.size(), passedTests, durationMillis, estimateMemoryBytes(sourceCode));
        return new EvaluationResponse(true, evaluation.passed() ? "PASSED" : "PARTIAL", evaluation.passed() ? "All tests passed. Ready to submit." : "Some tests still fail. Review the cases below.", evaluation.totalTests(), evaluation.passedTests(), evaluation.score().correctnessPoints(), evaluation.score().executionTimeMillis(), evaluation.score().memoryBytes(), outcomes, List.of());
    }

    private Map<String, ChallengeDefinition> loadDefinitions() {
        try {
            JsonNode root = readChallengesRoot();
            Map<String, ChallengeDefinition> map = new LinkedHashMap<>();
            for (JsonNode node : root.path("challenges")) {
                ChallengeDefinition def = parseReflectiveDefinition(node);
                map.put(def.challenge.id(), def);
            }
            return map.entrySet().stream()
                    .sorted(Comparator.comparing(e -> difficultyRank(e.getValue().challenge.difficulty().name())))
                    .collect(LinkedHashMap::new, (m, e) -> m.put(e.getKey(), e.getValue()), LinkedHashMap::putAll);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to load reflective challenge definitions from challenges.json", e);
        }
    }

    private static JsonNode readChallengesRoot() throws IOException {
        Path file = Path.of("challenges.json");
        if (Files.exists(file)) {
            return OBJECT_MAPPER.readTree(Files.readString(file, StandardCharsets.UTF_8));
        }
        try (InputStream in = ChallengeWorkbench.class.getClassLoader().getResourceAsStream("challenges.json")) {
            if (in == null) throw new IOException("challenges.json not found");
            return OBJECT_MAPPER.readTree(in);
        }
    }

    private ChallengeDefinition parseReflectiveDefinition(JsonNode node) {
        String id = node.path("id").asText();
        Difficulty difficulty = parseDifficulty(node.path("level").asText("beginner"));
        Challenge challenge = new Challenge(id, node.path("title").asText("Untitled"), difficulty, node.path("details").asText(""), node.path("explanation").asText(""), readStringList(node.path("resources")));
        String mode = node.path("sandboxProfile").path("mode").asText("reflective");
        if (!"reflective".equals(mode)) {
            String reason = "Challenge mode '" + mode + "' is not supported by reflective evaluator. Use sandbox runtime mode dispatch for this challenge.";
            return new ChallengeDefinition(challenge, challenge.prompt(), node.path("starterCode").asText(""), node.path("methodContract").asText(""), readStringList(node.path("examples")), List.of(), reason);
        }
        String methodContract = node.path("methodContract").asText("");
        Signature signature = parseSignature(methodContract);
        if (signature == null || !signature.supported()) {
            String reason = "Unsupported methodContract for reflective mode: " + methodContract;
            return new ChallengeDefinition(challenge, challenge.prompt(), node.path("starterCode").asText(""), methodContract, readStringList(node.path("examples")), List.of(), reason);
        }
        List<ChallengeTest> tests = buildTests(signature, node.path("testCases"));
        return new ChallengeDefinition(challenge, challenge.prompt(), node.path("starterCode").asText(""), methodContract, readStringList(node.path("examples")), tests, null);
    }

    private static Difficulty parseDifficulty(String level) {
        return switch (level.toLowerCase(Locale.ROOT)) {
            case "beginner" -> Difficulty.BEGINNER;
            case "intermediate" -> Difficulty.INTERMEDIATE;
            default -> Difficulty.ADVANCED;
        };
    }

    private static List<String> readStringList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) out.add(item.asText());
        }
        return out;
    }

    private static List<ChallengeTest> buildTests(Signature signature, JsonNode testCases) {
        List<ChallengeTest> tests = new ArrayList<>();
        if (testCases == null || !testCases.isArray()) return tests;
        for (JsonNode tc : testCases) {
            String name = tc.path("name").asText("solve");
            JsonNode input = tc.path("input");
            JsonNode expected = tc.get("expected");
            tests.add(test(name, (type, instance) -> {
                Object[] args = parseArgs(signature.paramTypes, input);
                Object actual = type.getMethod("solve", signature.paramTypes).invoke(instance, args);
                Object expectedValue = convert(expected, signature.returnType);
                boolean passed = Objects.deepEquals(normalizeArray(actual), normalizeArray(expectedValue));
                return new TestOutcome(name, passed, passed ? "Expected and received matching result." : "Expected " + stringify(expectedValue) + " but received " + stringify(actual) + ".");
            }));
        }
        return tests;
    }

    private static Object[] parseArgs(Class<?>[] types, JsonNode input) {
        Object[] args = new Object[types.length];
        for (int i = 0; i < types.length; i++) {
            args[i] = convert(input.get(i), types[i]);
        }
        return args;
    }

    private static Object convert(JsonNode node, Class<?> target) {
        if (target == int.class || target == Integer.class) return node.asInt();
        if (target == long.class || target == Long.class) return node.asLong();
        if (target == double.class || target == Double.class) return node.asDouble();
        if (target == boolean.class || target == Boolean.class) return node.asBoolean();
        if (target == String.class) return node.isNull() ? null : node.asText();
        if (target.isArray()) {
            Class<?> component = target.getComponentType();
            Object arr = Array.newInstance(component, node.size());
            for (int i = 0; i < node.size(); i++) Array.set(arr, i, convert(node.get(i), component));
            return arr;
        }
        throw new IllegalArgumentException("Unsupported reflective target type: " + target.getName());
    }

    private static Object normalizeArray(Object value) {
        if (value == null || !value.getClass().isArray()) return value;
        int len = Array.getLength(value);
        Object[] norm = new Object[len];
        for (int i = 0; i < len; i++) norm[i] = normalizeArray(Array.get(value, i));
        return norm;
    }

    private static String stringify(Object value) {
        if (value == null) return "null";
        Object norm = normalizeArray(value);
        if (norm instanceof Object[] arr) return java.util.Arrays.deepToString(arr);
        return String.valueOf(norm);
    }

    private static Signature parseSignature(String methodContract) {
        if (methodContract == null || methodContract.isBlank()) return null;
        String text = methodContract.trim();
        int solveIdx = text.indexOf(" solve(");
        if (solveIdx <= 0 || !text.endsWith(")")) return null;
        String returnTypeName = text.substring(0, solveIdx).trim();
        String params = text.substring(solveIdx + " solve(".length(), text.length() - 1).trim();
        List<Class<?>> parsedParams = new ArrayList<>();
        if (!params.isBlank()) {
            for (String raw : params.split(",")) {
                String part = raw.trim();
                int lastSpace = part.lastIndexOf(' ');
                if (lastSpace <= 0) return null;
                String typeName = part.substring(0, lastSpace).trim();
                Class<?> clazz = mapType(typeName);
                if (clazz == null) return null;
                parsedParams.add(clazz);
            }
        }
        Class<?> returnType = mapType(returnTypeName);
        if (returnType == null) return null;
        return new Signature(returnType, parsedParams.toArray(Class[]::new));
    }

    private static Class<?> mapType(String name) {
        return switch (name) {
            case "int" -> int.class;
            case "long" -> long.class;
            case "double" -> double.class;
            case "boolean" -> boolean.class;
            case "String", "java.lang.String" -> String.class;
            case "int[]" -> int[].class;
            case "long[]" -> long[].class;
            case "double[]" -> double[].class;
            case "boolean[]" -> boolean[].class;
            case "String[]" -> String[].class;
            case "int[][]" -> int[][].class;
            case "long[][]" -> long[][].class;
            case "double[][]" -> double[][].class;
            case "boolean[][]" -> boolean[][].class;
            case "String[][]" -> String[][].class;
            case "Integer" -> Integer.class;
            case "Long" -> Long.class;
            case "Double" -> Double.class;
            case "Boolean" -> Boolean.class;
            default -> null;
        };
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
            } catch (ReflectiveOperationException | RuntimeException e) {
                return new TestOutcome(name, false, "Reflection error: " + e.getMessage());
            }
        };
    }

    private static CompilationArtifact compile(String sourceCode) {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) return CompilationArtifact.failed(List.of("Java compiler not available. Run this project with a JDK."));
        try {
            Path outputDirectory = Files.createTempDirectory("java-interview-practice");
            Path sourceFile = outputDirectory.resolve("Solution.java");
            Files.writeString(sourceFile, sourceCode, StandardCharsets.UTF_8);
            DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
            try (StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
                Iterable<? extends JavaFileObject> units = fileManager.getJavaFileObjects(sourceFile.toFile());
                Boolean success = compiler.getTask(null, fileManager, diagnostics, List.of("-d", outputDirectory.toString()), null, units).call();
                if (Boolean.TRUE.equals(success)) return CompilationArtifact.success(outputDirectory);
            }
            List<String> messages = diagnostics.getDiagnostics().stream().map(ChallengeWorkbench::formatDiagnostic).toList();
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
        if (root == null || !Files.exists(root)) return;
        try {
            Files.walk(root).sorted(Comparator.reverseOrder()).forEach(path -> {
                try { Files.deleteIfExists(path); } catch (IOException ignored) { }
            });
        } catch (IOException ignored) { }
    }

    private static long estimateMemoryBytes(String sourceCode) {
        return Math.max(4096L, sourceCode.getBytes(StandardCharsets.UTF_8).length * 32L);
    }

    private ChallengeDefinition requireDefinition(String challengeId) {
        ChallengeDefinition definition = definitions.get(challengeId);
        if (definition == null) throw new IllegalArgumentException("Unknown challenge: " + challengeId);
        return definition;
    }

    private String nextSubmissionId() { return "submission-" + submissionSequence.getAndIncrement(); }

    private static String normalizeUser(String userId) {
        if (userId == null || userId.isBlank()) return "guest";
        return userId.trim();
    }

    private record Signature(Class<?> returnType, Class<?>[] paramTypes) {
        private boolean supported() { return returnType != null; }
    }

    @FunctionalInterface
    private interface TestExecutor { TestOutcome run(Class<?> type, Object instance) throws ReflectiveOperationException; }

    @FunctionalInterface
    private interface ChallengeTest { TestOutcome execute(Class<?> type, Object instance); }

    private record ChallengeDefinition(Challenge challenge, String prompt, String starterCode, String methodContract, List<String> examples, List<ChallengeTest> tests, String unsupportedReason) {
        private ChallengeView view() {
            return new ChallengeView(challenge.id(), challenge.title(), challenge.difficulty().name(), prompt, challenge.explanation(), challenge.resources(), starterCode, methodContract, examples);
        }
    }

    private record CompilationArtifact(Path outputDirectory, List<String> diagnostics) {
        private static CompilationArtifact success(Path outputDirectory) { return new CompilationArtifact(outputDirectory, List.of()); }
        private static CompilationArtifact failed(List<String> diagnostics) { return new CompilationArtifact(null, diagnostics); }
        private boolean success() { return outputDirectory != null; }
        private void cleanup() { deleteRecursively(outputDirectory); }
    }

    public record ChallengeView(String id, String title, String difficulty, String prompt, String explanation, List<String> resources, String starterCode, String methodContract, List<String> examples) {}
    public record TestOutcome(String name, boolean passed, String detail) {}
    public record EvaluationResponse(boolean accepted, String status, String message, int totalTests, int passedTests, int correctnessPoints, long executionTimeMillis, long memoryBytes, List<TestOutcome> tests, List<String> diagnostics) {}
    public record SubmissionResponse(String submissionId, String status, EvaluationResponse evaluation) {}
    public record ReviewView(String provider, String qualityAssessment, String improvementSuggestion, List<String> followUpQuestions) {}
    public record HintView(String provider, String level, String nextLevel, String hint) {}
}
