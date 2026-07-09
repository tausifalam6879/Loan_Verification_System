package com.loan.VerificationSystem.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loan.VerificationSystem.dto.AiChatMessageDTO;
import com.loan.VerificationSystem.dto.AiChatRequestDTO;
import com.loan.VerificationSystem.dto.AiChatResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AiChatService {

    private static final String SYSTEM_PROMPT = """
            You are FinTrack AI, a financial assistant inside an expense tracking dashboard.
            Answer only using the provided user dashboard context and general financial reasoning.
            Do not invent transactions, balances, categories, or forecasts.
            If information is missing, say what data is missing.
            Give short, practical, actionable answers.
            Use Indian Rupees when amounts are present.
            For risky financial advice, avoid guarantees and suggest reviewing details.
            Answer in the user's language. If the user uses Hinglish, answer in Hinglish.
            """;

    private final AiDashboardContextService contextService;
    private final ObjectMapper objectMapper;
    private final RestClient openAiClient;
    private final RestClient localOpenAiClient;
    private final RestClient geminiClient;
    private final RestClient ollamaClient;
    private final String provider;
    private final String openAiApiKey;
    private final String localOpenAiApiKey;
    private final String geminiApiKey;
    private final String model;

    public AiChatService(
            AiDashboardContextService contextService,
            ObjectMapper objectMapper,
            @Value("${app.llm.provider:local}") String provider,
            @Value("${app.llm.openai-api-key:}") String openAiApiKey,
            @Value("${app.llm.local-base-url:http://localhost:11434/v1}") String localLlmBaseUrl,
            @Value("${app.llm.local-api-key:}") String localOpenAiApiKey,
            @Value("${app.llm.gemini-api-key:}") String geminiApiKey,
            @Value("${app.llm.model:}") String llmModel,
            @Value("${app.llm.timeout-ms:15000}") int timeoutMs,
            @Value("${app.llm.ollama-base-url:http://localhost:11434}") String ollamaBaseUrl
    ) {
        this.contextService = contextService;
        this.objectMapper = objectMapper;
        this.provider = provider == null ? "local" : provider.trim().toLowerCase(Locale.ROOT);
        this.openAiApiKey = openAiApiKey == null ? "" : openAiApiKey.trim();
        this.localOpenAiApiKey = localOpenAiApiKey == null ? "" : localOpenAiApiKey.trim();
        this.geminiApiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
        this.model = resolveModel(this.provider, llmModel);

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        this.openAiClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .requestFactory(requestFactory)
                .build();
        this.localOpenAiClient = RestClient.builder()
                .baseUrl(localLlmBaseUrl)
                .requestFactory(requestFactory)
                .build();
        this.geminiClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(requestFactory)
                .build();
        this.ollamaClient = RestClient.builder()
                .baseUrl(ollamaBaseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public AiChatResponseDTO answer(AiChatRequestDTO request) {
        Map<String, Object> context = contextService.buildContext(request.page());
        List<String> suggestedQuestions = suggestedQuestions(context);

        try {
            if ("openai".equals(provider)) {
                if (openAiApiKey.isBlank()) {
                    return missingProvider("LLM service is not configured. Please add OPENAI_API_KEY in backend environment variables.", suggestedQuestions);
                }
                return answerWithOpenAi(request, context, suggestedQuestions);
            }

            if ("gemini".equals(provider)) {
                if (geminiApiKey.isBlank()) {
                    return missingProvider("LLM service is not configured. Please add GEMINI_API_KEY in backend environment variables.", suggestedQuestions);
                }
                return answerWithGemini(request, context, suggestedQuestions);
            }

            if ("ollama".equals(provider)) {
                return answerWithOllama(request, context, suggestedQuestions);
            }

            if ("openai-compatible".equals(provider)) {
                return answerWithOpenAiCompatible(request, context, suggestedQuestions);
            }
        } catch (RestClientException | IllegalStateException ex) {
            if ("ollama".equals(provider) || "openai-compatible".equals(provider)) {
                return new AiChatResponseDTO(
                        "Local LLM service is not running. Please start Odysseus/Ollama and try again.",
                        true,
                        suggestedQuestions,
                        provider,
                        model,
                        false
                );
            }

            return new AiChatResponseDTO(
                    localAnalyticsAnswer(request.message(), context) + "\n\nLLM provider slow/unavailable tha, isliye backend analytics se answer diya.",
                    true,
                    suggestedQuestions,
                    "local-analytics",
                    "repository-context",
                    false
            );
        }

        return new AiChatResponseDTO(
                localAnalyticsAnswer(request.message(), context),
                true,
                suggestedQuestions,
                "local-analytics",
                "repository-context",
                false
        );
    }

    private AiChatResponseDTO answerWithOpenAi(
            AiChatRequestDTO request,
            Map<String, Object> context,
            List<String> suggestedQuestions
    ) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT + "\nDashboard context JSON:\n" + toJson(context)));
        for (AiChatMessageDTO item : safeHistory(request)) {
            messages.add(Map.of(
                    "role", "assistant".equalsIgnoreCase(item.role()) ? "assistant" : "user",
                    "content", item.text()
            ));
        }
        messages.add(Map.of("role", "user", "content", request.message()));

        JsonNode response = openAiClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + openAiApiKey)
                .body(Map.of(
                        "model", model,
                        "messages", messages,
                        "temperature", 0.25
                ))
                .retrieve()
                .body(JsonNode.class);

        String answer = response == null ? "" : response.at("/choices/0/message/content").asText("");
        if (answer.isBlank()) {
            throw new IllegalStateException("OpenAI response did not include answer text");
        }

        return new AiChatResponseDTO(answer.trim(), true, suggestedQuestions, "openai", model, true);
    }

    private AiChatResponseDTO answerWithOpenAiCompatible(
            AiChatRequestDTO request,
            Map<String, Object> context,
            List<String> suggestedQuestions
    ) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT + "\nDashboard context JSON:\n" + toJson(context)));
        for (AiChatMessageDTO item : safeHistory(request)) {
            messages.add(Map.of(
                    "role", "assistant".equalsIgnoreCase(item.role()) ? "assistant" : "user",
                    "content", item.text()
            ));
        }
        messages.add(Map.of("role", "user", "content", request.message()));

        RestClient.RequestBodySpec requestSpec = localOpenAiClient.post()
                .uri("/chat/completions");
        if (!localOpenAiApiKey.isBlank()) {
            requestSpec = requestSpec.header(HttpHeaders.AUTHORIZATION, "Bearer " + localOpenAiApiKey);
        }

        JsonNode response = requestSpec
                .body(Map.of(
                        "model", model,
                        "messages", messages,
                        "temperature", 0.25
                ))
                .retrieve()
                .body(JsonNode.class);

        String answer = response == null ? "" : response.at("/choices/0/message/content").asText("");
        if (answer.isBlank()) {
            throw new IllegalStateException("OpenAI-compatible response did not include answer text");
        }

        return new AiChatResponseDTO(answer.trim(), true, suggestedQuestions, "openai-compatible", model, true);
    }

    private AiChatResponseDTO answerWithGemini(
            AiChatRequestDTO request,
            Map<String, Object> context,
            List<String> suggestedQuestions
    ) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (AiChatMessageDTO item : safeHistory(request)) {
            contents.add(Map.of(
                    "role", "assistant".equalsIgnoreCase(item.role()) ? "model" : "user",
                    "parts", List.of(Map.of("text", item.text()))
            ));
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.message()))
        ));

        String modelPath = model.startsWith("models/") ? model.substring("models/".length()) : model;
        JsonNode response = geminiClient.post()
                .uri("/v1beta/models/{model}:generateContent", modelPath)
                .header("x-goog-api-key", geminiApiKey)
                .body(Map.of(
                        "systemInstruction", Map.of("parts", List.of(Map.of(
                                "text", SYSTEM_PROMPT + "\nDashboard context JSON:\n" + toJson(context)
                        ))),
                        "contents", contents,
                        "generationConfig", Map.of("temperature", 0.25)
                ))
                .retrieve()
                .body(JsonNode.class);

        String answer = response == null ? "" : response.at("/candidates/0/content/parts/0/text").asText("");
        if (answer.isBlank()) {
            throw new IllegalStateException("Gemini response did not include answer text");
        }

        return new AiChatResponseDTO(answer.trim(), true, suggestedQuestions, "gemini", model, true);
    }

    private AiChatResponseDTO answerWithOllama(
            AiChatRequestDTO request,
            Map<String, Object> context,
            List<String> suggestedQuestions
    ) {
        JsonNode response = ollamaClient.post()
                .uri("/api/chat")
                .body(Map.of(
                        "model", model,
                        "stream", false,
                        "messages", List.of(
                                Map.of("role", "system", "content", SYSTEM_PROMPT + "\nDashboard context JSON:\n" + toJson(context)),
                                Map.of("role", "user", "content", request.message())
                        )
                ))
                .retrieve()
                .body(JsonNode.class);

        String answer = response == null ? "" : response.at("/message/content").asText("");
        if (answer.isBlank()) {
            throw new IllegalStateException("Ollama response did not include answer text");
        }

        return new AiChatResponseDTO(answer.trim(), true, suggestedQuestions, "ollama", model, true);
    }

    private AiChatResponseDTO missingProvider(String message, List<String> suggestedQuestions) {
        return new AiChatResponseDTO(message, false, suggestedQuestions, provider, model, false);
    }

    private List<AiChatMessageDTO> safeHistory(AiChatRequestDTO request) {
        List<AiChatMessageDTO> history = request.recentMessages() != null ? request.recentMessages() : request.history();
        if (history == null) {
            return List.of();
        }

        return history.stream()
                .filter(item -> item != null && item.text() != null && !item.text().isBlank())
                .skip(Math.max(0, history.size() - 8))
                .toList();
    }

    @SuppressWarnings("unchecked")
    private String localAnalyticsAnswer(String rawMessage, Map<String, Object> context) {
        String message = rawMessage == null ? "" : rawMessage.toLowerCase(Locale.ROOT);
        int transactionCount = ((Number) context.getOrDefault("transactionCount", 0)).intValue();
        double currentMonthExpense = ((Number) context.getOrDefault("currentMonthExpense", 0)).doubleValue();
        String currentMonth = String.valueOf(context.getOrDefault("currentMonth", "current month"));
        List<Map<String, Object>> topCategories = (List<Map<String, Object>>) context.getOrDefault("topCategories", List.of());
        List<Map<String, Object>> recentTransactions = (List<Map<String, Object>>) context.getOrDefault("recentTransactions", List.of());
        List<Map<String, Object>> anomalies = (List<Map<String, Object>>) context.getOrDefault("unusualSpending", List.of());
        Map<String, Object> forecast = (Map<String, Object>) context.getOrDefault("forecastNextMonth", Map.of("amount", 0));
        List<String> savingSignals = (List<String>) context.getOrDefault("savingSignals", List.of());

        if (transactionCount == 0) {
            return "Abhi backend database me expense transactions available nahi hain. Pehle kuch expenses add karo, phir main top category, forecast, anomaly aur saving tips data ke basis par bata paunga.";
        }

        if (containsAny(message, "sabse zyada", "top category", "highest", "maximum", "kis category")) {
            if (topCategories.isEmpty()) {
                return "Category data available nahi hai. Expense category ke saath transactions add karo.";
            }
            Map<String, Object> top = topCategories.get(0);
            return "Sabse zyada kharcha " + top.get("category") + " category me hua hai: Rs. " + format(top.get("amount")) + ".";
        }

        if (containsAny(message, "last 5", "recent", "latest", "transactions", "transaction batao")) {
            if (recentTransactions.isEmpty()) {
                return "Recent transaction data available nahi hai.";
            }
            StringBuilder answer = new StringBuilder("Last 5 transactions:\n");
            recentTransactions.stream().limit(5).forEach(item ->
                    answer.append("- ")
                            .append(item.get("date"))
                            .append(": ")
                            .append(item.get("description"))
                            .append(" (")
                            .append(item.get("category"))
                            .append(") - Rs. ")
                            .append(format(item.get("amount")))
                            .append("\n")
            );
            return answer.toString().trim();
        }

        if (containsAny(message, "saving", "tips", "save", "bachat", "improve")) {
            List<String> tips = new ArrayList<>(savingSignals);
            tips.add("Top category ke liye weekly cap set karo aur bade transactions same day review karo.");
            tips.add("Payment/food jaise repeat spends ko separate note karo, taaki avoidable entries clearly dikhein.");
            tips.add("Agle month ke forecast ko target maan kar daily average spend limit follow karo.");
            List<String> uniqueTips = tips.stream().distinct().limit(3).toList();
            StringBuilder answer = new StringBuilder("Aapke data ke basis par 3 saving tips:\n");
            uniqueTips.forEach(signal -> answer.append("- ").append(signal).append("\n"));
            return answer.toString().trim();
        }

        if (containsAny(message, "this month", "is month", "current month", "total expense", "kitna")) {
            return currentMonth + " ka total expense Rs. " + format(currentMonthExpense) + " hai.";
        }

        if (containsAny(message, "unusual", "anomaly", "normal", "abnormal")) {
            if (anomalies.isEmpty()) {
                return "Abhi koi unusual spending detect nahi hui. Note: anomaly detection tab stronger hoti hai jab ek category me kam se kam 3 transactions hon.";
            }
            Map<String, Object> item = anomalies.get(0);
            return "Unusual spending detected: " + item.get("category") + " me Rs. " + format(item.get("amount")) + ". Reason: " + item.get("reason");
        }

        if (containsAny(message, "forecast", "next month", "agle month")) {
            return "Next month expense forecast approx Rs. " + format(forecast.get("amount")) + " hai. Method: " + forecast.get("method") + ".";
        }

        if (containsAny(message, "balance decreasing", "balance kam", "balance down", "why is my balance", "balance reduce")) {
            String topText = topCategories.isEmpty()
                    ? "top category data available nahi hai"
                    : "sabse bada spend " + topCategories.get(0).get("category") + " me Rs. " + format(topCategories.get(0).get("amount")) + " hai";
            return "Aapka balance expense ledger ke total spends/payments ki wajah se decrease hota hai. Backend ke paas frontend-local income/current balance stored nahi hai, isliye exact balance audit missing hai. Available data ke hisaab se " + currentMonth + " expense Rs. " + format(currentMonthExpense) + " hai aur " + topText + ".";
        }

        if (containsAny(message, "loan", "emi", "risk")) {
            return "Loan/EMI risk ke liye backend me saved loan applications, requested amount, income, existing EMI, credit score aur fraud score use hote hain. Agar loan application data missing hai, pehle loan form submit karo.";
        }

        return "Main aapke backend expense data se answer kar raha hoon. Available data: " + transactionCount + " transactions, " + currentMonth + " expense Rs. " + format(currentMonthExpense) + ". Aap top category, last 5 transactions, saving tips, forecast ya unusual spending pooch sakte ho.";
    }

    private List<String> suggestedQuestions(Map<String, Object> context) {
        return List.of(
                "Mera sabse zyada kharcha kis category me hua?",
                "Last 5 transactions batao",
                "Mujhe saving improve karne ke liye 3 tips do",
                "Is month total expense kitna hai?",
                "Kya koi unusual spending hai?"
        );
    }

    private String toJson(Map<String, Object> context) {
        try {
            return objectMapper.writeValueAsString(context);
        } catch (JsonProcessingException ex) {
            return context.toString();
        }
    }

    private boolean containsAny(String value, String... keywords) {
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String format(Object value) {
        if (value instanceof Number number) {
            return String.format(Locale.ENGLISH, "%,.0f", number.doubleValue());
        }
        return String.valueOf(value);
    }

    private String resolveModel(String provider, String llmModel) {
        if (llmModel != null && !llmModel.isBlank()) {
            return llmModel.trim();
        }
        if ("gemini".equals(provider)) {
            return "gemini-2.5-flash";
        }
        if ("ollama".equals(provider)) {
            return "llama3.2:3b";
        }
        if ("openai-compatible".equals(provider)) {
            return "local-model";
        }
        return "gpt-4o-mini";
    }
}
