package com.multilang.memo.service;

import com.multilang.memo.entity.Concept;
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

    @Test
    void shouldThrowException_WhenNameIsEmpty() {
        // Given
        Concept concept = new Concept();
        concept.setUserId("1");
        concept.setUsername("user1");
        concept.setName("");

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("name cannot be empty");
    }

    @Test
    void shouldThrowException_WhenNameIsNull() {
        // Given
        Concept concept = new Concept();
        concept.setUserId("1");
        concept.setUsername("user1");
        concept.setName(null);

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("name cannot be empty");
    }

    @Test
    void shouldThrowException_WhenUsernameIsEmpty() {
        // Given
        Concept concept = new Concept();
        concept.setUserId("1");
        concept.setUsername("");
        concept.setName("test");

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("username cannot be empty");
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
        concept.setUserId("1");
        concept.setUsername("user1");
        concept.setName("existing");

        // When & Then
        assertThatThrownBy(() -> conceptService.createConcept(concept))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("already exists");

        verify(conceptRepository, never()).save(any());
    }

    @Test
    void shouldCreateConcept_WhenValidInputProvided() {
        // Given
        Concept concept = new Concept();
        concept.setUserId("1");
        concept.setUsername("user1");
        concept.setName("new concept");

        when(conceptRepository.existsByUsernameAndName("user1", "new concept")).thenReturn(false);
        when(conceptRepository.save(any())).thenReturn(concept);

        // When
        Concept result = conceptService.createConcept(concept);

        // Then
        assertThat(result.getName()).isEqualTo("new concept");
        assertThat(result.getUsername()).isEqualTo("user1");
        verify(conceptRepository).save(concept);
    }

    @Test
    void shouldGetConcept_WhenValidIdProvided() {
        // Given
        Concept concept = new Concept();
        concept.setId(1L);
        concept.setUserId("1");
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
