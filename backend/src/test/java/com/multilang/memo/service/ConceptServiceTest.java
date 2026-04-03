package com.multilang.memo.service;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.User;
import com.multilang.memo.exception.DuplicateResourceException;
import com.multilang.memo.exception.ResourceNotFoundException;
import com.multilang.memo.repository.ConceptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConceptServiceTest {

    @Mock
    private ConceptRepository conceptRepository;

    @InjectMocks
    private ConceptService conceptService;

    private User buildUser(String username) {
        User user = new User();
        user.setUsername(username);
        return user;
    }

    @Test
    void shouldThrowException_WhenNameIsEmpty() {
        // Given
        Concept concept = new Concept();
        concept.setName("");

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept, buildUser("user1")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Concept名を入力してください");
    }

    @Test
    void shouldThrowException_WhenNameIsNull() {
        // Given
        Concept concept = new Concept();
        concept.setName(null);

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept, buildUser("user1")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Concept名を入力してください");
    }

    @Test
    void shouldThrowException_WhenConceptNotFound() {
        // Given
        when(conceptRepository.findByIdWithWords(999L, "user1")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> conceptService.getConceptById(999L, "user1"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Concept not found");
    }

    @Test
    void shouldThrowException_WhenConceptAlreadyExists() {
        // Given
        when(conceptRepository.existsByUsernameAndName("user1", "existing")).thenReturn(true);

        Concept concept = new Concept();
        concept.setName("existing");

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept, buildUser("user1")))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("already exists");

        verify(conceptRepository, never()).save(any());
    }

    @Test
    void shouldCreateConcept_WhenValidInputProvided() {
        // Given
        Concept concept = new Concept();
        concept.setName("new concept");

        Concept savedConcept = new Concept();
        savedConcept.setId(1L);
        savedConcept.setName("new concept");
        savedConcept.setUsername("user1");

        when(conceptRepository.existsByUsernameAndName("user1", "new concept")).thenReturn(false);
        when(conceptRepository.save(any())).thenReturn(savedConcept);
        when(conceptRepository.findByIdWithWords(1L, "user1")).thenReturn(Optional.of(savedConcept));

        // When
        Concept result = conceptService.createConcept(concept, buildUser("user1"));

        // Then
        assertThat(result.getName()).isEqualTo("new concept");
        assertThat(result.getUsername()).isEqualTo("user1");
        verify(conceptRepository).save(concept);
        verify(conceptRepository).findByIdWithWords(1L, "user1");
    }

    @Test
    void shouldGetConcept_WhenValidIdProvided() {
        // Given
        Concept concept = new Concept();
        concept.setId(1L);
        concept.setUsername("user1");
        concept.setName("test concept");

        when(conceptRepository.findByIdWithWords(1L, "user1")).thenReturn(Optional.of(concept));

        // When
        Concept result = conceptService.getConceptById(1L, "user1");

        // Then
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("test concept");
        verify(conceptRepository).findByIdWithWords(1L, "user1");
    }
}
