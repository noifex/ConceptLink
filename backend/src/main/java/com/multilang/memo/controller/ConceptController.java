package com.multilang.memo.controller;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.repository.ConceptRepository;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManagerFactory;
import java.util.List;

@RestController
@RequestMapping("/api/concepts")
@CrossOrigin(origins = "*")
public class ConceptController {

    private static final Logger log = LoggerFactory.getLogger(ConceptController.class);

    @Autowired
    private ConceptRepository conceptRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @GetMapping
    public List<Concept> getAll(@RequestParam(required = false) String query) {
        // 統計をクリア
        long startTime = System.nanoTime();

        // JOIN FETCH版に変更
        List<Concept> concepts = conceptRepository.findAllWithWordsEagerly();

        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;

        log.info("[N+1解決後] GET /api/concepts - Count: {}, Time: {}ms",
                concepts.size(), durationMs);

        return concepts;
    }

    @GetMapping("/{id}")
    public Concept getById(@PathVariable Long id) {
        // 統計をクリア
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics stats = sessionFactory.getStatistics();
        stats.clear();

        long startTime = System.nanoTime();

        Concept concept = conceptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concept not found"));

        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;

        // 統計を出力
        log.info("=".repeat(80));
        log.info("[N+1問題あり] GET /api/concepts/{}", id);
        log.info("Words数: {}", concept.getWords().size());
        log.info("応答時間: {}ms", durationMs);
        log.info("-".repeat(80));
        log.info("Hibernate統計:");
        log.info("クエリ実行回数: {}", stats.getQueryExecutionCount());
        log.info("準備されたステートメント数: {}", stats.getPrepareStatementCount());
        log.info("エンティティロード数: {}", stats.getEntityLoadCount());
        log.info("コレクションロード数: {}", stats.getCollectionLoadCount());
        log.info("接続取得回数: {}", stats.getConnectCount());
        log.info("=".repeat(80));

        return concept;
    }

    // 他のメソッド（create, update, delete）は同じ
    @PostMapping
    public Concept create(@RequestBody Concept concept) {
        return conceptRepository.save(concept);
    }

    @PutMapping("/{id}")
    public Concept update(@PathVariable Long id, @RequestBody Concept concept) {
        Concept existing = conceptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concept not found"));
        existing.setNotes(concept.getNotes());
        return conceptRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        conceptRepository.deleteById(id);
    }
}