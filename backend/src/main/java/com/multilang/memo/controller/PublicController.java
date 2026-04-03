package com.multilang.memo.controller;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.service.ConceptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "http://localhost:5173")
public class PublicController {

    private final ConceptService conceptService;
    private static final String DEMO_USERNAME = "demo-user";

    public PublicController(ConceptService conceptService) {
        this.conceptService = conceptService;
    }

    @GetMapping("/demo-concepts/search")
    public ResponseEntity<List<Concept>> searchDemoConcepts(
        @RequestParam String keyword
    ) {
        List<Concept> results = conceptService.searchConcepts(DEMO_USERNAME, keyword);
        return ResponseEntity.ok(results);
    }
}
