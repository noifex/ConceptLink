package com.multilang.memo.service;
import  com.multilang.memo.entity.Concept;
import  com.multilang.memo.entity.Word;
import  com.multilang.memo.repository.ConceptRepository;
import  com.multilang.memo.repository.WordRepository;
import  org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import  java.util.*;
import java.util.stream.Stream;

@Service
public class SearchService {
    private final ConceptRepository conceptRepository;
    private  final WordRepository wordRepository;

    public SearchService(ConceptRepository conceptRepository,WordRepository wordRepository){
        this.conceptRepository=conceptRepository;
        this.wordRepository=wordRepository;
    }

    public  List<Concept>search(String username, String keyword){
        return  conceptRepository.searchByKeyword(username, keyword);
        }


    }

