package com.multilang.memo.controller;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.User;
import com.multilang.memo.repository.ConceptRepository;
import com.multilang.memo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concepts")
public class ConceptController {

    @Autowired
    private ConceptRepository conceptRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper method to extract username from Authorization header
    private String getUsernameFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }

        String token = authHeader.substring(7);
        User user = userRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid token"));

        return user.getUsername();
    }

    @PostMapping
    public Concept add(@RequestHeader("Authorization") String authHeader, @RequestBody Concept concept) {
        String username = getUsernameFromToken(authHeader);
        concept.setUsername(username);
        return conceptRepository.save(concept);
    }

    @GetMapping  // 全件取得（ユーザー別）
    public List<Concept> getAll(@RequestHeader("Authorization") String authHeader, @RequestParam(required = false) String query) {
        long startTime = System.currentTimeMillis();
        String username = getUsernameFromToken(authHeader);

        List<Concept> concepts;
        if (query != null && !query.isEmpty()) {
            concepts = conceptRepository.searchByKeyword(username, query);
        } else {
            concepts = conceptRepository.findAllWithWordsEagerly(username);
        }

        long endTime = System.currentTimeMillis();
        System.out.println("⏱️ Concept取得時間: " + (endTime - startTime) + "ms(query=" + query + ")");

        return concepts;
    }

    @GetMapping("/{id}")
    public Concept getById(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        long startTime = System.currentTimeMillis();
        String username = getUsernameFromToken(authHeader);

        Concept concept = conceptRepository.findByIdWithWords(id, username)
            .orElseThrow(() -> new RuntimeException("Concept not found"));

        long endTime = System.currentTimeMillis();
        System.out.println("Concept詳細：" + (endTime - startTime) + "ms");
        return concept;
    }

    @GetMapping("/search")
    public List<Concept> search(@RequestHeader("Authorization") String authHeader, @RequestParam String keyword) {
        String username = getUsernameFromToken(authHeader);
        return conceptRepository.searchByKeyword(username, keyword);
    }

    @PutMapping("/{id}")
    public Concept update(@RequestHeader("Authorization") String authHeader, @PathVariable Long id, @RequestBody Concept concept) {
        String username = getUsernameFromToken(authHeader);

        Concept existing = conceptRepository.findByIdWithWords(id, username)
            .orElseThrow(() -> new RuntimeException("Concept not found"));

        existing.setName(concept.getName());
        existing.setNotes(concept.getNotes());
        return conceptRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        String username = getUsernameFromToken(authHeader);

        Concept existing = conceptRepository.findByIdWithWords(id, username)
            .orElseThrow(() -> new RuntimeException("Concept not found"));

        conceptRepository.delete(existing);
    }
}
