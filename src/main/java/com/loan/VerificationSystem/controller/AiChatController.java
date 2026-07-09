package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.dto.AiChatRequestDTO;
import com.loan.VerificationSystem.dto.AiChatResponseDTO;
import com.loan.VerificationSystem.response.ApiResponse;
import com.loan.VerificationSystem.service.AiChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ApiResponse<AiChatResponseDTO> chat(@Valid @RequestBody AiChatRequestDTO request) {
        return new ApiResponse<>(
                true,
                "AI chat response generated",
                aiChatService.answer(request)
        );
    }
}
