package com.multilang.memo.entity;
import  jakarta.persistence.*;
import  lombok.Data;
import  com.fasterxml.jackson.annotation.JsonIgnore;
import  java.util.List;

@Entity
@Data
@Table(name="words")
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long id;
    @ManyToOne
    @JoinColumn(name = "concept_id")
    @JsonIgnore
    private  Concept concept;
    private  String word;
    private  String language;
    private  String nuance;
    private  String ipa;


}
