package com.multilang.memo.repository;

import com.multilang.memo.entity.Concept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConceptRepository extends JpaRepository<Concept, Long> {

    // 検索（Concept name OR Concept notes OR Word word）
    @Query("SELECT DISTINCT c FROM Concept c LEFT JOIN FETCH c.words w " +
            "WHERE c.name LIKE CONCAT('%', :keyword, '%') OR c.notes LIKE CONCAT('%', :keyword, '%') OR w.word LIKE CONCAT('%', :keyword, '%')")
    List<Concept> searchByKeyword(@Param("keyword") String keyword);

    // 全件取得（検索なし）
    @Query("SELECT DISTINCT c FROM Concept c LEFT JOIN FETCH c.words")
    List<Concept> findAllWithWordsEagerly();

    // 詳細取得（ID指定）
    @Query("SELECT c FROM Concept c LEFT JOIN FETCH c.words WHERE c.id = :id")
    Optional<Concept> findByIdWithWords(@Param("id") Long id);
}