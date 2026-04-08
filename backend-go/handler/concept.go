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

type ConceptHandler struct {
	DB   *sql.DB
	Auth *AuthHandler
}

// POST /api/concepts
func (h *ConceptHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	var concept model.Concept
	if err := json.NewDecoder(r.Body).Decode(&concept); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if concept.Name == "" {
		writeError(w, http.StatusBadRequest, "Concept名を入力してください")
		return
	}

	exists, err := db.ConceptExistsByUsernameAndName(h.DB, user.Username, concept.Name)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if exists {
		writeError(w, http.StatusConflict, "Concept '"+concept.Name+"' already exists")
		return
	}

	created, err := db.CreateConcept(h.DB, user.Username, concept.Name, concept.Notes)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, created)
}

// GET /api/concepts
func (h *ConceptHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	query := r.URL.Query().Get("query")
	var concepts []model.Concept
	var err error

	if query != "" {
		concepts, err = db.GetAllConceptsWithQuery(h.DB, user.Username, query)
	} else {
		concepts, err = db.GetAllConcepts(h.DB, user.Username)
	}
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, concepts)
}

// GET /api/concepts/{id}
func (h *ConceptHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid concept ID")
		return
	}

	concept, err := db.GetConceptByID(h.DB, id, user.Username)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if concept == nil {
		writeError(w, http.StatusNotFound, "Concept not found with id: "+strconv.FormatInt(id, 10))
		return
	}

	writeJSON(w, http.StatusOK, concept)
}

// GET /api/concepts/search
func (h *ConceptHandler) Search(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	keyword := r.URL.Query().Get("keyword")
	concepts, err := db.SearchConcepts(h.DB, user.Username, keyword)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, concepts)
}

// PUT /api/concepts/{id}
func (h *ConceptHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid concept ID")
		return
	}

	existing, err := db.GetConceptByID(h.DB, id, user.Username)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if existing == nil {
		writeError(w, http.StatusNotFound, "Concept not found with id: "+strconv.FormatInt(id, 10))
		return
	}

	var concept model.Concept
	if err := json.NewDecoder(r.Body).Decode(&concept); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updated, err := db.UpdateConcept(h.DB, id, concept.Name, concept.Notes, user.Username)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

// DELETE /api/concepts/{id}
func (h *ConceptHandler) Delete(w http.ResponseWriter, r *http.Request) {
	user := h.Auth.Authenticate(w, r)
	if user == nil {
		return
	}

	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid concept ID")
		return
	}

	if err := db.DeleteConcept(h.DB, id, user.Username); err != nil {
		if err.Error() == "not found" {
			writeError(w, http.StatusNotFound, "Concept not found with id: "+strconv.FormatInt(id, 10))
			return
		}
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
