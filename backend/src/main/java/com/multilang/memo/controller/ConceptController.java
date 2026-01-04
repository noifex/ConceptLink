package com.multilang.memo.controller;
import  com.multilang.memo.entity.Concept;
import com.multilang.memo.repository.ConceptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concepts")

public class ConceptController {
    @Autowired
    private  ConceptRepository conceptRepository;
    public  ConceptController(ConceptRepository conceptRepository ){
        this.conceptRepository=conceptRepository;
    }
    @PostMapping
    public  Concept add(@RequestBody Concept concept){
        return conceptRepository.save(concept);
    }
    @GetMapping  // 全件取得
    public List<Concept> getAll(@RequestParam(required = false) String query) {
        long startTime = System.currentTimeMillis();

        List<Concept> concepts;
        if(query!=null&&!query.isEmpty()){
            concepts=conceptRepository.searchByKeyword(query);
        }else{
            concepts=conceptRepository.findAllWithWordsEagerly();
        }

        long endTime = System.currentTimeMillis();
        System.out.println("⏱️ Concept取得時間: " + (endTime - startTime) + "ms(query="+query+")");

        return concepts;
        //return conceptRepository.findAll();
    }
    @GetMapping("/{id}")
    public  Concept getById(@PathVariable Long id){
        long startTime=System.currentTimeMillis();
        Concept concept=conceptRepository.findByIdWithWords(id)
                .orElseThrow(()-> new RuntimeException("Concept not found"));
        long endTime =System.currentTimeMillis();
        System.out.println("Concept詳細："+(endTime-startTime)+"ms");
        return  concept;
    }
    @GetMapping("/search")
    public List<Concept> search(@RequestParam String keyword){
        return  conceptRepository.searchByKeyword(keyword);
    }
    @PutMapping("/{id}")
    public Concept update(@PathVariable Long id ,@RequestBody Concept concept){
        Concept existing =conceptRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Concept not found"));
        existing.setNotes(concept.getNotes());
        return  conceptRepository.save(existing);
    }
    @DeleteMapping("/{id}")
    public  void delete (@PathVariable Long id){
        conceptRepository.deleteById(id);
    }

}
