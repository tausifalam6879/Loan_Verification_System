package com.loan.VerificationSystem.controller;

import com.loan.VerificationSystem.dto.MarketAgentRequestDTO;
import com.loan.VerificationSystem.service.MarketIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketIntelligenceService marketIntelligenceService;

    public MarketController(MarketIntelligenceService marketIntelligenceService) {
        this.marketIntelligenceService = marketIntelligenceService;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(defaultValue = "false") boolean refresh) {
        return marketIntelligenceService.getOverview(refresh);
    }

    @GetMapping("/currencies")
    public Map<String, Object> currencies(@RequestParam(defaultValue = "false") boolean refresh) {
        return marketIntelligenceService.getCurrencies(refresh);
    }

    @GetMapping("/analysis")
    public Map<String, Object> analysis(
            @RequestParam(defaultValue = "^NSEI") String symbol,
            @RequestParam(defaultValue = "false") boolean refresh
    ) {
        return marketIntelligenceService.getAnalysis(symbol, refresh);
    }

    @GetMapping("/factors")
    public Map<String, Object> factors(@RequestParam(defaultValue = "false") boolean refresh) {
        return marketIntelligenceService.getFactors(refresh);
    }

    @GetMapping("/breadth")
    public Map<String, Object> breadth(@RequestParam(defaultValue = "false") boolean refresh) {
        return marketIntelligenceService.getBreadth(refresh);
    }

    @GetMapping("/company")
    public Map<String, Object> company(
            @RequestParam(defaultValue = "RELIANCE.NS") String symbol,
            @RequestParam(defaultValue = "false") boolean refresh
    ) {
        return marketIntelligenceService.getCompany(symbol, refresh);
    }

    @GetMapping("/news-feed")
    public Map<String, Object> newsFeed(@RequestParam(defaultValue = "false") boolean refresh) {
        return marketIntelligenceService.getNewsFeed(refresh);
    }

    @GetMapping("/news")
    public Map<String, Object> news(@RequestParam(defaultValue = "^NSEI") String symbol) {
        return marketIntelligenceService.getNews(symbol);
    }

    @PostMapping("/agent")
    public Map<String, Object> agent(@Valid @RequestBody MarketAgentRequestDTO request) {
        return marketIntelligenceService.askAgent(request);
    }
}
