package handler

import (
	"database/sql"
	"net/http"

	"github.com/conceptlink/backend-go/db"
)

const demoUsername = "demo-user"

type PublicHandler struct {
	DB *sql.DB
}

// GET /api/public/demo-concepts/search?keyword=
func (h *PublicHandler) SearchDemoConcepts(w http.ResponseWriter, r *http.Request) {
	keyword := r.URL.Query().Get("keyword")
	concepts, err := db.SearchConcepts(h.DB, demoUsername, keyword)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, concepts)
}
