package com.multilang.memo.config;

import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.Word;
import com.multilang.memo.repository.ConceptRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ConceptRepository conceptRepository;

    public DataInitializer(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    @Override
    public void run(String... args) {
        if (!conceptRepository.findAllWithWordsEagerly("demo-user").isEmpty()) {
            return;
        }

        // Single concept — "Promise", "非同期", "async" all resolve to this same entry.
        // The search query matches on concept name, notes, OR any associated word.
        conceptRepository.saveAll(List.of(
            buildConcept(
                "demo", "demo-user",
                "非同期処理",
                "async / Promise — operations that run independently of the main program flow. " +
                "A Promise is a value that will be resolved in the future without blocking execution.",
                List.of(
                    buildWord("Promise",     "English",  "/ˈprɒmɪs/",   "A future value produced by async code"),
                    buildWord("async",       "English",  "/ˈeɪsɪŋk/",   "Short for asynchronous; non-blocking execution"),
                    buildWord("非同期",      "Japanese", "ひどうき",      "メインスレッドをブロックしない処理"),
                    buildWord("asynchrone",  "French",   "/asingkʁon/", "Traitement non bloquant")
                )
            )
        ));
    }

    private Concept buildConcept(String userId, String username, String name, String notes, List<Word> words) {
        Concept concept = new Concept();
        concept.setUserId(userId);
        concept.setUsername(username);
        concept.setName(name);
        concept.setNotes(notes);
        for (Word word : words) {
            word.setConcept(concept);
        }
        concept.setWords(words);
        return concept;
    }

    private Word buildWord(String word, String language, String ipa, String nuance) {
        Word w = new Word();
        w.setWord(word);
        w.setLanguage(language);
        w.setIpa(ipa);
        w.setNuance(nuance);
        return w;
    }
}
