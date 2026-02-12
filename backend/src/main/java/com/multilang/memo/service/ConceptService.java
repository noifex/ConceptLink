package com.multilang.memo.service;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.exception.DuplicateResourceException;
import com.multilang.memo.exception.ResourceNotFoundException;
import com.multilang.memo.repository.ConceptRepository;
import org.springframework.stereotype.Service;

@Service
public class ConceptService {

    private final ConceptRepository conceptRepository;

    public ConceptService(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    /**
     * Create a new concept with validation
     */
    public Concept createConcept(Concept concept) {
        // Validate username
        if (concept.getUsername() == null || concept.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("username cannot be empty");
        }

        // Validate name
        if (concept.getName() == null || concept.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("name cannot be empty");
        }

        // Check for duplicates
        if (conceptRepository.existsByUsernameAndName(concept.getUsername(), concept.getName())) {
            throw new DuplicateResourceException(
                "Concept with name '" + concept.getName() + "' already exists for user '" + concept.getUsername() + "'"
            );
        }

        // Save and return
        return conceptRepository.save(concept);
    }

    /**
     * Get concept by ID and username
     */
    public Concept getConceptById(Long id, String username) {
        return conceptRepository.findByIdWithWords(id, username)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Concept not found with id: " + id + " for user: " + username
            ));
    }
}
