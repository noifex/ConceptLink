package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"runtime"
	"time"

	"github.com/conceptlink/backend-go/model"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	statusText := http.StatusText(status)
	writeJSON(w, status, model.ErrorResponse{
		Status:    status,
		Error:     statusText,
		Message:   message,
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// writeInternalError logs the actual error with caller location, then returns a generic 500 to the client.
func writeInternalError(w http.ResponseWriter, err error) {
	_, file, line, ok := runtime.Caller(1)
	if ok {
		file = filepath.Base(file)
		log.Printf("ERROR %s:%d %v", file, line, err)
	} else {
		log.Printf("ERROR %v", err)
	}
	writeError(w, http.StatusInternalServerError, "Internal server error")
}
