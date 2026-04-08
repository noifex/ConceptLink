package handler_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/conceptlink/backend-go/db"
	"github.com/conceptlink/backend-go/handler"
	"github.com/conceptlink/backend-go/model"
	"github.com/go-chi/chi/v5"
)

// setupTestDB creates an in-memory SQLite database for testing.
func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	database, err := db.Init(":memory:")
	if err != nil {
		t.Fatalf("Failed to init test DB: %v", err)
	}
	t.Cleanup(func() { database.Close() })
	return database
}

// setupRouter creates a chi router with all handlers wired up.
func setupRouter(database *sql.DB) http.Handler {
	auth := &handler.AuthHandler{DB: database}
	concepts := &handler.ConceptHandler{DB: database, Auth: auth}
	words := &handler.WordHandler{DB: database, Auth: auth}
	public := &handler.PublicHandler{DB: database}

	r := chi.NewRouter()

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", auth.Register)
		r.Post("/verify-token", auth.VerifyToken)
		r.Post("/logout", auth.Logout)
		r.Post("/invalidate-all", auth.InvalidateAll)
	})

	r.Route("/api/concepts", func(r chi.Router) {
		r.Post("/", concepts.Create)
		r.Get("/", concepts.GetAll)
		r.Get("/search", concepts.Search)
		r.Get("/{id}", concepts.GetByID)
		r.Put("/{id}", concepts.Update)
		r.Delete("/{id}", concepts.Delete)

		r.Route("/{conceptId}/words", func(r chi.Router) {
			r.Post("/", words.Create)
			r.Get("/", words.GetAll)
			r.Get("/{id}", words.GetByID)
			r.Put("/{id}", words.Update)
			r.Delete("/{id}", words.Delete)
		})
	})

	r.Get("/api/public/demo-concepts/search", public.SearchDemoConcepts)

	return r
}

func jsonBody(v any) io.Reader {
	b, _ := json.Marshal(v)
	return bytes.NewReader(b)
}

// registerUser registers a user and returns the token.
func registerUser(t *testing.T, router http.Handler, username string) string {
	t.Helper()
	req := httptest.NewRequest("POST", "/api/auth/register", jsonBody(model.RegisterRequest{Username: username}))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("register failed: %d %s", w.Code, w.Body.String())
	}

	var resp model.AuthResponse
	json.NewDecoder(w.Body).Decode(&resp)
	return resp.Token
}

// ==================== Auth Tests ====================

func TestRegister(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)

	// Success
	token := registerUser(t, router, "testuser")
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	// Duplicate
	req := httptest.NewRequest("POST", "/api/auth/register", jsonBody(model.RegisterRequest{Username: "testuser"}))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d", w.Code)
	}

	// Too short
	req = httptest.NewRequest("POST", "/api/auth/register", jsonBody(model.RegisterRequest{Username: "ab"}))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestVerifyToken(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)
	token := registerUser(t, router, "verifyuser")

	req := httptest.NewRequest("POST", "/api/auth/verify-token", jsonBody(model.TokenRequest{Token: token}))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp model.AuthResponse
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Username != "verifyuser" {
		t.Errorf("expected verifyuser, got %s", resp.Username)
	}
}

func TestVerifyToken_Invalid(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)

	req := httptest.NewRequest("POST", "/api/auth/verify-token", jsonBody(model.TokenRequest{Token: "invalid-token"}))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestLogout(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)
	token := registerUser(t, router, "logoutuser")

	// Logout
	req := httptest.NewRequest("POST", "/api/auth/logout", jsonBody(model.TokenRequest{Token: token}))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	// Token should now be expired
	req = httptest.NewRequest("POST", "/api/auth/verify-token", jsonBody(model.TokenRequest{Token: token}))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 after logout, got %d", w.Code)
	}
}

// ==================== Concept Tests ====================

func TestConceptCRUD(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)
	token := registerUser(t, router, "conceptuser")
	auth := "Bearer " + token

	// Create
	req := httptest.NewRequest("POST", "/api/concepts/", jsonBody(map[string]string{
		"name":  "TestConcept",
		"notes": "some notes",
	}))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("create concept: expected 200, got %d %s", w.Code, w.Body.String())
	}

	var concept model.Concept
	json.NewDecoder(w.Body).Decode(&concept)
	if concept.Name != "TestConcept" {
		t.Errorf("expected TestConcept, got %s", concept.Name)
	}
	if concept.Words == nil {
		t.Error("words should be empty array, not nil")
	}

	// Get All
	req = httptest.NewRequest("GET", "/api/concepts/", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("get all: expected 200, got %d %s", w.Code, w.Body.String())
	}

	var concepts []model.Concept
	json.NewDecoder(w.Body).Decode(&concepts)
	if len(concepts) != 1 {
		t.Errorf("expected 1 concept, got %d", len(concepts))
	}

	// Get By ID
	req = httptest.NewRequest("GET", "/api/concepts/1", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("get by id: expected 200, got %d", w.Code)
	}

	// Update
	req = httptest.NewRequest("PUT", "/api/concepts/1", jsonBody(map[string]string{
		"name":  "UpdatedConcept",
		"notes": "updated notes",
	}))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("update: expected 200, got %d %s", w.Code, w.Body.String())
	}

	var updated model.Concept
	json.NewDecoder(w.Body).Decode(&updated)
	if updated.Name != "UpdatedConcept" {
		t.Errorf("expected UpdatedConcept, got %s", updated.Name)
	}

	// Search
	req = httptest.NewRequest("GET", "/api/concepts/search?keyword=Updated", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("search: expected 200, got %d", w.Code)
	}

	var searchResults []model.Concept
	json.NewDecoder(w.Body).Decode(&searchResults)
	if len(searchResults) != 1 {
		t.Errorf("search: expected 1 result, got %d", len(searchResults))
	}

	// Delete
	req = httptest.NewRequest("DELETE", "/api/concepts/1", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("delete: expected 200, got %d", w.Code)
	}

	// Verify deleted
	req = httptest.NewRequest("GET", "/api/concepts/1", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 after delete, got %d", w.Code)
	}
}

func TestConceptDuplicate(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)
	token := registerUser(t, router, "dupuser")
	auth := "Bearer " + token

	body := jsonBody(map[string]string{"name": "SameName"})
	req := httptest.NewRequest("POST", "/api/concepts/", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("first create failed: %d", w.Code)
	}

	body = jsonBody(map[string]string{"name": "SameName"})
	req = httptest.NewRequest("POST", "/api/concepts/", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusConflict {
		t.Errorf("expected 409 for duplicate, got %d", w.Code)
	}
}

func TestConceptUnauthorized(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)

	req := httptest.NewRequest("GET", "/api/concepts/", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

// ==================== Word Tests ====================

func TestWordCRUD(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)
	token := registerUser(t, router, "worduser")
	auth := "Bearer " + token

	// Create concept first
	req := httptest.NewRequest("POST", "/api/concepts/", jsonBody(map[string]string{"name": "WordTest"}))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("create concept failed: %d %s", w.Code, w.Body.String())
	}

	// Add Word
	req = httptest.NewRequest("POST", "/api/concepts/1/words/", jsonBody(map[string]any{
		"word":     "hello",
		"language": "en",
		"ipa":      "/həˈloʊ/",
		"nuance":   "greeting",
	}))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("add word: expected 200, got %d %s", w.Code, w.Body.String())
	}

	var word model.Word
	json.NewDecoder(w.Body).Decode(&word)
	if word.Word != "hello" {
		t.Errorf("expected hello, got %s", word.Word)
	}

	// Get All Words
	req = httptest.NewRequest("GET", "/api/concepts/1/words/", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("get all words: expected 200, got %d", w.Code)
	}

	var words []model.Word
	json.NewDecoder(w.Body).Decode(&words)
	if len(words) != 1 {
		t.Errorf("expected 1 word, got %d", len(words))
	}

	// Get Word by ID
	req = httptest.NewRequest("GET", "/api/concepts/1/words/1", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("get word: expected 200, got %d", w.Code)
	}

	// Update Word
	req = httptest.NewRequest("PUT", "/api/concepts/1/words/1", jsonBody(map[string]any{
		"word":             "hola",
		"language":         "es",
		"ipa":              "/ˈola/",
		"nuance":           "spanish greeting",
		"usedInDefinition": true,
	}))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("update word: expected 200, got %d %s", w.Code, w.Body.String())
	}

	var updatedWord model.Word
	json.NewDecoder(w.Body).Decode(&updatedWord)
	if updatedWord.Word != "hola" {
		t.Errorf("expected hola, got %s", updatedWord.Word)
	}
	if !updatedWord.UsedInDefinition {
		t.Error("expected usedInDefinition to be true")
	}

	// Delete Word
	req = httptest.NewRequest("DELETE", "/api/concepts/1/words/1", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("delete word: expected 200, got %d", w.Code)
	}

	// Verify deleted
	req = httptest.NewRequest("GET", "/api/concepts/1/words/1", nil)
	req.Header.Set("Authorization", auth)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 after delete, got %d", w.Code)
	}
}

func TestWordConceptIsolation(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)

	token1 := registerUser(t, router, "user1aa")
	token2 := registerUser(t, router, "user2bb")

	// user1 creates a concept
	req := httptest.NewRequest("POST", "/api/concepts/", jsonBody(map[string]string{"name": "User1Concept"}))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token1)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("user1 create: %d", w.Code)
	}

	// user2 cannot access user1's concept
	req = httptest.NewRequest("GET", "/api/concepts/1", nil)
	req.Header.Set("Authorization", "Bearer "+token2)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Errorf("user2 should not see user1's concept, got %d", w.Code)
	}
}

// ==================== Public Tests ====================

func TestPublicSearch(t *testing.T) {
	database := setupTestDB(t)
	router := setupRouter(database)

	// Create demo user and concept directly in DB
	db.CreateUser(database, "demo-user", "demo-token", time.Now().Add(90*24*time.Hour))
	db.CreateConcept(database, "demo-user", "DemoConcept", nil)

	req := httptest.NewRequest("GET", "/api/public/demo-concepts/search?keyword=Demo", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var concepts []model.Concept
	json.NewDecoder(w.Body).Decode(&concepts)
	if len(concepts) != 1 {
		t.Errorf("expected 1 demo concept, got %d", len(concepts))
	}
}
