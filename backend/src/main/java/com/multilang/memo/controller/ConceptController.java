package com.multilang.memo.controller;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.User;
import com.multilang.memo.service.AuthService;
import com.multilang.memo.service.ConceptService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concepts")
public class ConceptController {

    private final ConceptService conceptService;
    private final AuthService authService;

    public  ConceptController(ConceptService conceptService,AuthService authService){
        this.conceptService=conceptService;
        this.authService=authService;
    }
    // Helper method to extract user from Authorization header

    // Helper method to extract username from Authorization header
    // private String getUsernameFromToken(String authHeader) {
       // return getUserFromToken(authHeader).getUsername();
    //}

    @PostMapping
    public Concept add(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Concept concept) {
        User user = authService.authenticate(authHeader);
        return conceptService.createConcept(concept,user);
    }

    @GetMapping  // 全件取得（ユーザー別）
    public List<Concept> getAll(@RequestHeader("Authorization") String authHeader,
                                @RequestParam(required = false) String query) {
        User user = authService.authenticate(authHeader);
        return conceptService.getAllConcepts(user.getUsername(),query);
    }

    @GetMapping("/{id}")
    public Concept getById(@RequestHeader("Authorization") String authHeader,
                           @PathVariable Long id) {
        User user = authService.authenticate(authHeader);
        return  conceptService.getConceptById(id,user.getUsername());
    }

    @GetMapping("/search")
    public List<Concept> search(@RequestHeader("Authorization") String authHeader,
                                @RequestParam String keyword) {
        User user = authService.authenticate(authHeader);
        return  conceptService.searchConcepts(user.getUsername(),keyword);
    }

    @PutMapping("/{id}")
    public Concept update(@RequestHeader("Authorization") String authHeader,
                          @PathVariable Long id,
                          @RequestBody Concept concept) {
        User user = authService.authenticate(authHeader);
        return conceptService.updateConcept(id,concept,user.getUsername());
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestHeader("Authorization") String authHeader,
                       @PathVariable Long id) {
        User user = authService.authenticate(authHeader);
       conceptService.deleteConcept(id,user.getUsername());
    }
}
