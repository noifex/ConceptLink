package com.multilang.memo.service;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.Word;
import com.multilang.memo.exception.ResourceNotFoundException;
import com.multilang.memo.repository.WordRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WordService {
    private final WordRepository wordRepository;
    private final  ConceptService conceptService;

    public WordService(WordRepository wordRepository, ConceptService conceptService){
        this.wordRepository=wordRepository;
        this.conceptService=conceptService;
    }

    // addWord: long ,Word, String -> Word
    // conceptId should  be username's
    public Word addWord(Long conceptId, Word word, String username){
        Concept concept = conceptService.getConceptById(conceptId,username);
        word.setConcept(concept);
        return wordRepository.save(word);
    }

    //getAllWords : (Long,String) -> List<Word>
    public List<Word> getAllWords(Long conceptId,String username){
        conceptService.getConceptById(conceptId,username);
        return wordRepository.findByConceptId(conceptId);
    }

    //gotWord: (Long, Long , String) -> Word
    public Word getWord(Long conceptId,Long wordId,String username){
        conceptService.getConceptById(conceptId,username);
        return wordRepository.findById(wordId)
                .orElseThrow(()-> new ResourceNotFoundException(
                        "Word not found with Id :"+wordId
                ));
    }

    //updateWord : (Long, Long, Word, String )-> Word
    public  Word updateWord(Long conceptId,Long wordId,Word word, String username){
        conceptService.getConceptById(conceptId,username);
        Word existing=wordRepository.findById(wordId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Word not found with id" +wordId
                ));
        existing.setWord(word.getWord());
        existing.setLanguage(word.getLanguage());
        existing.setIpa(word.getIpa());
        existing.setNuance(word.getNuance());
        return wordRepository.save(existing);
    }

    //deleteWord:(Long , Long , String )->void
    public void deleteWord(Long conceptId,Long wordId,String username){
        conceptService.getConceptById(conceptId,username);
        wordRepository.deleteById(wordId);
    }
}
