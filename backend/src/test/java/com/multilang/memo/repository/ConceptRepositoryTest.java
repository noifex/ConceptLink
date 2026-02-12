package com.multilang.memo.repository;

import com.multilang.memo.entity.Concept;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class ConceptRepositoryTest {

    @Autowired
    private  ConceptRepository conceptRepository;
    @Autowired
    private TestEntityManager entityManager;
    @Test
    void shouldReturnTrue_WhenIdExists() {
        // Given
        Concept concept = createConcept("test_user", "distributed system");
        Concept saved = entityManager.persistAndFlush(concept);

        // When
        boolean exists = conceptRepository.existsById(saved.getId());

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void shouldReturnFalse_WhenIdDoesNotExist() {
        // When
        boolean exists = conceptRepository.existsById(999L);

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void shouldCreateAndGetConcept_WhenValidDataProvided() {
        // Create
        Concept concept = createConcept("user1", "microservices");
        Concept saved = conceptRepository.save(concept);
        entityManager.flush();

        // Read
        Optional<Concept> found = conceptRepository.findById(saved.getId());

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("user1");
        assertThat(found.get().getName()).isEqualTo("microservices");
    }

    @Test
    void shouldUpdateConcept_WhenValidDataProvided() {
        // Given
        Concept concept = createConcept("user1", "old name");
        Concept saved = conceptRepository.save(concept);
        entityManager.flush();
        entityManager.clear(); // Clear cache

        // When - Update
        Concept toUpdate = conceptRepository.findById(saved.getId()).orElseThrow();
        toUpdate.setName("new name");
        conceptRepository.save(toUpdate);
        entityManager.flush();

        // Then
        Concept updated = conceptRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("new name");
        assertThat(updated.getId()).isEqualTo(saved.getId());
    }

    @Test
    void shouldDeleteConcept_WhenValidIdProvided() {
        // Given
        Concept concept = createConcept("user1", "to be deleted");
        Concept saved = conceptRepository.save(concept);
        entityManager.flush();

        // When - Delete
        conceptRepository.deleteById(saved.getId());
        entityManager.flush();

        // Then
        Optional<Concept> deleted = conceptRepository.findById(saved.getId());
        assertThat(deleted).isEmpty();
        assertThat(conceptRepository.existsById(saved.getId())).isFalse();
    }
    @Test
    void shouldSearchByKeyword_WhenPartialMatchExists() {
        // Given
        entityManager.persist(createConcept("user1", "distributed system"));
        entityManager.persist(createConcept("user1", "distributed database"));
        entityManager.persist(createConcept("user1", "microservices"));
        entityManager.persist(createConcept("user2", "distributed computing")); // Different user
        entityManager.flush();

        // When
        var results = conceptRepository.searchByKeyword("user1", "distributed");

        // Then
        assertThat(results).hasSize(2);
        assertThat(results).extracting(Concept::getName)
                .containsExactlyInAnyOrder("distributed system", "distributed database");
    }

    @Test
    void shouldFindByIdWithWords_WhenConceptExists() {
        // Given
        Concept concept = createConcept("user1", "test concept");
        Concept saved = entityManager.persistAndFlush(concept);

        // When
        Optional<Concept> found = conceptRepository.findByIdWithWords(saved.getId(), "user1");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("user1");
        assertThat(found.get().getName()).isEqualTo("test concept");
    }

    @Test
    void shouldReturnEmpty_WhenDifferentUserRequests() {
        // Given
        Concept concept = createConcept("user1", "test concept");
        Concept saved = entityManager.persistAndFlush(concept);

        // When
        Optional<Concept> found = conceptRepository.findByIdWithWords(saved.getId(), "user2");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    void shouldFindAllWithWordsEagerly_WhenUserHasConcepts() {
        // Given
        entityManager.persistAndFlush(createConcept("user1", "concept1"));
        entityManager.persistAndFlush(createConcept("user1", "concept2"));
        entityManager.persistAndFlush(createConcept("user2", "concept3"));

        // When
        List<Concept> user1Concepts = conceptRepository.findAllWithWordsEagerly("user1");

        // Then
        assertThat(user1Concepts).hasSize(2);
        assertThat(user1Concepts)
            .extracting(Concept::getUsername)
            .containsOnly("user1");
    }

    @Test
    void shouldReturnEmptyList_WhenUserHasNoConcepts() {
        // When
        List<Concept> concepts = conceptRepository.findAllWithWordsEagerly("nonexistent");

        // Then
        assertThat(concepts).isEmpty();
    }

    private Concept createConcept(String username, String name) {
        Concept concept = new Concept();
        concept.setUserId("test-user-id");
        concept.setUsername(username);
        concept.setName(name);
        return concept;
    }
}

