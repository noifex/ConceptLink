package com.multilang.memo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.multilang.memo.entity.Concept;
import com.multilang.memo.entity.User;
import com.multilang.memo.exception.ResourceNotFoundException;
import com.multilang.memo.service.AuthService;
import com.multilang.memo.service.ConceptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ConceptController.class)
class ConceptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ConceptService conceptService;

    @MockitoBean
    private AuthService authService;

    private static final String VALID_TOKEN = "valid-token-123";
    private static final String AUTH_HEADER = "Bearer " + VALID_TOKEN;
    private static final String USERNAME = "testuser";

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername(USERNAME);
        testUser.setToken(VALID_TOKEN);
        when(authService.authenticate(AUTH_HEADER)).thenReturn(testUser);
    }

    @Test
    void shouldGetAllConcepts_WhenValidAuthProvided() throws Exception {
        // Given
        Concept c1 = createConcept(1L, USERNAME, "concept1");
        Concept c2 = createConcept(2L, USERNAME, "concept2");
        when(conceptService.getAllConcepts(USERNAME, null)).thenReturn(Arrays.asList(c1, c2));

        // When & Then
        mockMvc.perform(get("/api/concepts")
                .header("Authorization", AUTH_HEADER))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("concept1"))
            .andExpect(jsonPath("$[1].name").value("concept2"));
    }

    @Test
    void shouldSearchConcepts_WhenQueryParamProvided() throws Exception {
        // Given
        Concept c1 = createConcept(1L, USERNAME, "distributed system");
        when(conceptService.getAllConcepts(USERNAME, "distributed")).thenReturn(Arrays.asList(c1));

        // When & Then
        mockMvc.perform(get("/api/concepts")
                .header("Authorization", AUTH_HEADER)
                .param("query", "distributed"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("distributed system"));
    }

    @Test
    void shouldCreateConcept_WhenValidDataProvided() throws Exception {
        // Given
        Concept newConcept = new Concept();
        newConcept.setName("new concept");
        newConcept.setNotes("test notes");

        Concept savedConcept = createConcept(1L, USERNAME, "new concept");
        savedConcept.setNotes("test notes");
        when(conceptService.createConcept(any(Concept.class), eq(testUser))).thenReturn(savedConcept);

        // When & Then
        mockMvc.perform(post("/api/concepts")
                .header("Authorization", AUTH_HEADER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newConcept)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("new concept"))
            .andExpect(jsonPath("$.username").value(USERNAME));

        verify(conceptService).createConcept(any(Concept.class), eq(testUser));
    }

    @Test
    void shouldGetConceptById_WhenValidIdProvided() throws Exception {
        // Given
        Concept concept = createConcept(1L, USERNAME, "test concept");
        when(conceptService.getConceptById(1L, USERNAME)).thenReturn(concept);

        // When & Then
        mockMvc.perform(get("/api/concepts/1")
                .header("Authorization", AUTH_HEADER))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("test concept"));
    }

    @Test
    void shouldReturnNotFound_WhenConceptDoesNotExist() throws Exception {
        // Given
        when(conceptService.getConceptById(999L, USERNAME))
            .thenThrow(new ResourceNotFoundException("Concept not found with id: 999"));

        // When & Then
        mockMvc.perform(get("/api/concepts/999")
                .header("Authorization", AUTH_HEADER))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldSearchByKeyword_WhenKeywordProvided() throws Exception {
        // Given
        Concept c1 = createConcept(1L, USERNAME, "distributed system");
        when(conceptService.searchConcepts(USERNAME, "distributed")).thenReturn(Arrays.asList(c1));

        // When & Then
        mockMvc.perform(get("/api/concepts/search")
                .header("Authorization", AUTH_HEADER)
                .param("keyword", "distributed"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("distributed system"));
    }

    @Test
    void shouldUpdateConcept_WhenValidDataProvided() throws Exception {
        // Given
        Concept updateRequest = new Concept();
        updateRequest.setName("updated name");
        updateRequest.setNotes("updated notes");

        Concept updated = createConcept(1L, USERNAME, "updated name");
        updated.setNotes("updated notes");

        when(conceptService.updateConcept(eq(1L), any(Concept.class), eq(USERNAME))).thenReturn(updated);

        // When & Then
        mockMvc.perform(put("/api/concepts/1")
                .header("Authorization", AUTH_HEADER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("updated name"))
            .andExpect(jsonPath("$.notes").value("updated notes"));

        verify(conceptService).updateConcept(eq(1L), any(Concept.class), eq(USERNAME));
    }

    @Test
    void shouldDeleteConcept_WhenValidIdProvided() throws Exception {
        // Given
        doNothing().when(conceptService).deleteConcept(1L, USERNAME);

        // When & Then
        mockMvc.perform(delete("/api/concepts/1")
                .header("Authorization", AUTH_HEADER))
            .andExpect(status().isOk());

        verify(conceptService).deleteConcept(1L, USERNAME);
    }

    @Test
    void shouldReturnBadRequest_WhenNoAuthHeaderProvided() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/concepts"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnUnauthorized_WhenInvalidTokenProvided() throws Exception {
        // Given
        when(authService.authenticate("Bearer invalid-token"))
            .thenThrow(new com.multilang.memo.exception.AuthenticationException("Invalid token"));

        // When & Then
        mockMvc.perform(get("/api/concepts")
                .header("Authorization", "Bearer invalid-token"))
            .andExpect(status().isUnauthorized());
    }

    private Concept createConcept(Long id, String username, String name) {
        Concept concept = new Concept();
        concept.setId(id);
        concept.setUsername(username);
        concept.setName(name);
        return concept;
    }
}
