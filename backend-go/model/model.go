package model

import "time"

// User matches Spring Boot User entity
type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// Concept matches Spring Boot Concept entity
type Concept struct {
	ID       int64   `json:"id"`
	Username string  `json:"username,omitempty"`
	Name     string  `json:"name"`
	Notes    *string `json:"notes"`
	Words    []Word  `json:"words"`
}

// Word matches Spring Boot Word entity
type Word struct {
	ID               int64   `json:"id"`
	Word             string  `json:"word"`
	Language         string  `json:"language"`
	IPA              *string `json:"ipa"`
	Nuance           *string `json:"nuance"`
	UsedInDefinition bool    `json:"usedInDefinition"`
}

// --- DTOs ---

type RegisterRequest struct {
	Username string `json:"username"`
}

type TokenRequest struct {
	Token string `json:"token"`
}

type AuthResponse struct {
	Username string `json:"username"`
	Token    string `json:"token"`
}

// ErrorResponse matches Spring Boot GlobalExceptionHandler format
type ErrorResponse struct {
	Status    int    `json:"status"`
	Error     string `json:"error"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}
