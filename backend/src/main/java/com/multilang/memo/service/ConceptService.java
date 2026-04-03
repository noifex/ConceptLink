package com.multilang.memo.service;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.User;
import com.multilang.memo.exception.DuplicateResourceException;
import com.multilang.memo.exception.ResourceNotFoundException;
import com.multilang.memo.repository.ConceptRepository;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class ConceptService {

    private final ConceptRepository conceptRepository;

    public ConceptService(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    /**
     * Create a new concept with validation
     */
    public Concept createConcept(Concept concept, User user) {
        concept.setUsername(user.getUsername());
        // Validate name
        if (concept.getName() == null || concept.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Concept名を入力してください");
        }

        if (conceptRepository.existsByUsernameAndName(user.getUsername(),concept.getName())) {
            throw new DuplicateResourceException(
                    "Concept '" + concept.getName() + "' already exists"
            );
        }
        Concept saved = conceptRepository.save(concept);
        // wordsはLazyロードのため、JOIN FETCHで再取得してシリアライズエラーを防ぐ
        return conceptRepository.findByIdWithWords(saved.getId(), user.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Concept not found after save: " + saved.getId()));
    }

        // getAllConcepts: String, String? -> List<Concept>
        public  List<Concept> getAllConcepts(String username, String query){
            if(query !=null && !query.isEmpty()){
                return  conceptRepository.searchByKeyword(username, query);
            }
            return conceptRepository.findAllWithWordsEagerly(username);
        }
        // getConceptByid : (Long,String ) -> Concept
        public Concept getConceptById(Long id, String username) {
            return conceptRepository.findByIdWithWords(id, username)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Concept not found with id: " + id
                ));
    }
        public List<Concept> searchConcepts(String username, String keyword){
            return conceptRepository.searchByKeyword(username,keyword);
        }
        // updateConcept: Long , Concept ,String -> Concept
        public Concept updateConcept(Long id, Concept concept,String username){
            Concept existing=getConceptById(id,username);
            existing.setName(concept.getName());
            existing.setNotes(concept.getNotes());
            return conceptRepository.save(existing);
        }

        public  void deleteConcept(Long id, String username){
        Concept existing =getConceptById(id,username);
        conceptRepository.delete(existing);
        }
}
