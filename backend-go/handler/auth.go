package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/conceptlink/backend-go/db"
	"github.com/conceptlink/backend-go/model"
	"github.com/google/uuid"
)

type AuthHandler struct {
	DB *sql.DB
}

// Authenticate extracts and validates the Bearer token from the Authorization header.
// Returns the authenticated user or writes an error response and returns nil.
func (h *AuthHandler) Authenticate(w http.ResponseWriter, r *http.Request) *model.User {
	auth := r.Header.Get("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
		writeError(w, http.StatusUnauthorized, "Invalid authorization header")
		return nil
	}
	token := auth[7:]

	user, err := db.FindUserByToken(h.DB, token)
	if err != nil {
		writeInternalError(w, err)
		return nil
	}
	if user == nil {
		writeError(w, http.StatusUnauthorized, "Invalid token")
		return nil
	}
	if user.ExpiresAt.Before(time.Now()) {
		writeError(w, http.StatusUnauthorized, "Token expired")
		return nil
	}
	return user
}

// POST /api/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		writeError(w, http.StatusBadRequest, "ユーザー名を入力してください")
		return
	}
	if len(username) < 3 {
		writeError(w, http.StatusBadRequest, "ユーザー名は3文字以上必要です")
		return
	}
	if len(username) > 50 {
		writeError(w, http.StatusBadRequest, "ユーザー名は50文字以下で入力してください")
		return
	}

	existing, err := db.FindUserByUsername(h.DB, username)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	if existing != nil {
		if existing.ExpiresAt.After(time.Now()) {
			writeError(w, http.StatusConflict, "このユーザー名は既に使用されています")
			return
		}
		// Reactivate expired user
		existing.Token = uuid.New().String()
		existing.ExpiresAt = time.Now().Add(90 * 24 * time.Hour)
		if err := db.UpdateUser(h.DB, existing); err != nil {
			writeInternalError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, model.AuthResponse{
			Username: existing.Username,
			Token:    existing.Token,
		})
		return
	}

	// Create new user
	token := uuid.New().String()
	expiresAt := time.Now().Add(90 * 24 * time.Hour)
	user, err := db.CreateUser(h.DB, username, token, expiresAt)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, model.AuthResponse{
		Username: user.Username,
		Token:    user.Token,
	})
}

// POST /api/auth/verify-token
func (h *AuthHandler) VerifyToken(w http.ResponseWriter, r *http.Request) {
	var req model.TokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := db.FindUserByToken(h.DB, req.Token)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if user == nil {
		writeError(w, http.StatusUnauthorized, "無効なトークンです")
		return
	}
	if user.ExpiresAt.Before(time.Now()) {
		writeError(w, http.StatusUnauthorized, "トークンの有効期限が切れています")
		return
	}

	// Extend expiry
	user.ExpiresAt = time.Now().Add(90 * 24 * time.Hour)
	if err := db.UpdateUser(h.DB, user); err != nil {
		writeInternalError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, model.AuthResponse{
		Username: user.Username,
		Token:    user.Token,
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var req model.TokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := db.FindUserByToken(h.DB, req.Token)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	if user != nil {
		user.ExpiresAt = time.Now().Add(-24 * time.Hour)
		_ = db.UpdateUser(h.DB, user)
	}

	w.WriteHeader(http.StatusOK)
}

// POST /api/auth/invalidate-all
func (h *AuthHandler) InvalidateAll(w http.ResponseWriter, r *http.Request) {
	user := h.Authenticate(w, r)
	if user == nil {
		return
	}

	if err := db.InvalidateAllTokens(h.DB); err != nil {
		writeInternalError(w, err)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("All tokens invalidated"))
}
