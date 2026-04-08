package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/conceptlink/backend-go/db"
	"github.com/conceptlink/backend-go/model"
	"github.com/go-chi/chi/v5"
)

type WordHandler struct {
	DB   *sql.DB
	Auth *AuthHandler
}

// parseConceptID extracts conceptId from URL and verifies ownership.
// Returns the conceptID or writes an error and returns 0.
func (h *WordHandler) parseConceptID(w http.ResponseWriter, r *http.Request, username string) (int64, bool) {
	conceptID, err := strconv.ParseInt(chi.URLParam(r, "conceptId"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid concept ID")
		return 0, false
	}

	concept, err := db.GetConceptByID(h.DB, conceptID, username)
	if err != nil {
		writeInternalError(w, err)
		return 0, false
	}
	if concept == nil {
		writeError(w, http.StatusNotFound, "Concept not found with id: "+strconv.FormatInt(conceptID, 10))
		return 0, false
	}

	return conceptID, true
}

// POST /api/concepts/{conceptId}/words
func (h *WordHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	conceptID, ok := h.parseConceptID(w, r, user.Username)
	if !ok {
		return
	}

	var word model.Word
	if err := json.NewDecoder(r.Body).Decode(&word); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	created, err := db.CreateWord(h.DB, conceptID, &word)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, created)
}

// GET /api/concepts/{conceptId}/words
func (h *WordHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	conceptID, ok := h.parseConceptID(w, r, user.Username)
	if !ok {
		return
	}

	words, err := db.GetWordsByConceptID(h.DB, conceptID)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, words)
}

// GET /api/concepts/{conceptId}/words/{id}
func (h *WordHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	conceptID, ok := h.parseConceptID(w, r, user.Username)
	if !ok {
		return
	}

	wordID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid word ID")
		return
	}

	belongs, err := db.WordBelongsToConcept(h.DB, wordID, conceptID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if !belongs {
		writeError(w, http.StatusNotFound, "Word not found with Id :"+strconv.FormatInt(wordID, 10))
		return
	}

	word, err := db.GetWordByID(h.DB, wordID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if word == nil {
		writeError(w, http.StatusNotFound, "Word not found with Id :"+strconv.FormatInt(wordID, 10))
		return
	}

	writeJSON(w, http.StatusOK, word)
}

// PUT /api/concepts/{conceptId}/words/{id}
func (h *WordHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	conceptID, ok := h.parseConceptID(w, r, user.Username)
	if !ok {
		return
	}

	wordID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid word ID")
		return
	}

	belongs, err := db.WordBelongsToConcept(h.DB, wordID, conceptID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if !belongs {
		writeError(w, http.StatusNotFound, "Word not found with id"+strconv.FormatInt(wordID, 10))
		return
	}

	var word model.Word
	if err := json.NewDecoder(r.Body).Decode(&word); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updated, err := db.UpdateWord(h.DB, wordID, &word)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

// DELETE /api/concepts/{conceptId}/words/{id}
func (h *WordHandler) Delete(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	conceptID, ok := h.parseConceptID(w, r, user.Username)
	if !ok {
		return
	}

	wordID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid word ID")
		return
	}

	belongs, err := db.WordBelongsToConcept(h.DB, wordID, conceptID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if !belongs {
		writeError(w, http.StatusNotFound, "Word not found with Id :"+strconv.FormatInt(wordID, 10))
		return
	}

	if err := db.DeleteWord(h.DB, wordID); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
