package com.multilang.memo.controller;
import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.Word;
import com.multilang.memo.repository.ConceptRepository;
import com.multilang.memo.repository.WordRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concepts/{conceptId}/words")

public class WordController {
    private  final WordRepository wordRepository;
    private  final ConceptRepository conceptRepository;
    public  WordController(WordRepository wordRepository,ConceptRepository conceptRepository ){
        this.wordRepository=wordRepository;
        this.conceptRepository=conceptRepository;

    }
    @PostMapping
    public  Word add(@PathVariable Long conceptId,@RequestBody Word word){
        Concept concept =conceptRepository.findById(conceptId)
                .orElseThrow(()-> new RuntimeException("Concept not found"));

        word.setConcept(concept);
        return  wordRepository.save(word);
    }
    @GetMapping
    public List<Word> getAll(@PathVariable Long conceptId) {
        return wordRepository.findByConceptId(conceptId);
    }
    @GetMapping("/{id}")
    public  Word getById(@PathVariable Long conceptId,@PathVariable Long id){
        return wordRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Word not found"));
    }
    @PutMapping("/{id}")
    public  Word update(@PathVariable Long conceptId,@PathVariable Long id,@RequestBody Word word){
        Word existing =wordRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Word not found"));
        existing.setWord(word.getWord());
        existing.setLanguage(word.getLanguage());
        existing.setIpa(word.getIpa());
        existing.setNuance(word.getNuance());
        return  wordRepository.save(existing);
    }
    @DeleteMapping("/{id}")
    public  void  delete(@PathVariable Long conceptId,@PathVariable Long id){
        wordRepository.deleteById(id);
    }

}
