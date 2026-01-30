package com.multilang.memo.entity;

import  jakarta.persistence.*;
import  lombok.Data;

import java.util.ArrayList;
import  java.util.List;

@Entity
@Data
@Table(name="concept")
public class Concept {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Long id;
    @Column(nullable = false, length = 50)
    private String username;
    private  String name;
    private  String notes;

    @OneToMany(mappedBy = "concept",cascade = CascadeType.ALL)
    private  List<Word> words=new ArrayList<>();
}
