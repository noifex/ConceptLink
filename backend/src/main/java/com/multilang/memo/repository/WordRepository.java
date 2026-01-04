package com.multilang.memo.repository;
import com.multilang.memo.entity.Concept;
import  com.multilang.memo.entity.Word;
import  org.springframework.data.jpa.repository.JpaRepository;
import  org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface WordRepository extends JpaRepository<Word,Long>{
    List<Word> findByWordContaining(String keyword);
    List<Word> findByConceptId(Long conceptId);
}
