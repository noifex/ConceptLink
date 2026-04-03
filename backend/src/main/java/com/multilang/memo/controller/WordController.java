package com.multilang.memo.controller;

import com.multilang.memo.entity.User;
import com.multilang.memo.entity.Word;
import com.multilang.memo.service.AuthService;
import com.multilang.memo.service.WordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concepts/{conceptId}/words")
public class WordController {
    private final WordService wordService;
    private final AuthService authService;

    public WordController(WordService wordService, AuthService authService) {
        this.wordService = wordService;
        this.authService = authService;
    }

    @PostMapping
    public Word add(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long conceptId,
            @RequestBody Word word) {
        User user = authService.authenticate(authHeader);
        return wordService.addWord(conceptId, word, user.getUsername());
    }

    @GetMapping
    public List<Word> getAll(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long conceptId) {
        User user = authService.authenticate(authHeader);
        return wordService.getAllWords(conceptId, user.getUsername());
    }

    @GetMapping("/{id}")
    public Word getById(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long conceptId,
            @PathVariable Long id) {
        User user = authService.authenticate(authHeader);
        return wordService.getWord(conceptId, id, user.getUsername());
    }

    @PutMapping("/{id}")
    public Word update(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long conceptId,
            @PathVariable Long id,
            @RequestBody Word word) {
        User user = authService.authenticate(authHeader);
        return wordService.updateWord(conceptId, id, word, user.getUsername());
    }

    @DeleteMapping("/{id}")
    public void delete(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long conceptId,
            @PathVariable Long id) {
        User user = authService.authenticate(authHeader);
        wordService.deleteWord(conceptId, id, user.getUsername());
    }
}
