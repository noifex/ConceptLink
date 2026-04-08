package db

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/conceptlink/backend-go/model"
	_ "modernc.org/sqlite"
)

// Init opens the SQLite database and creates tables.
func Init(path string) (*sql.DB, error) {
	// For :memory: databases, use shared cache so all connections see the same DB.
	dsn := path
	if path == ":memory:" {
		dsn = "file::memory:?cache=shared"
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, err
	}
	if _, err := db.Exec("PRAGMA journal_mode = WAL"); err != nil {
		return nil, err
	}

	if err := createSchema(db); err != nil {
		return nil, err
	}
	return db, nil
}

func createSchema(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			username   TEXT NOT NULL UNIQUE,
			token      TEXT NOT NULL UNIQUE,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			expires_at DATETIME NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS concepts (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			username   TEXT NOT NULL,
			name       TEXT NOT NULL,
			notes      TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_concepts_username_name
			ON concepts(username, name)`,
		`CREATE TABLE IF NOT EXISTS words (
			id                  INTEGER PRIMARY KEY AUTOINCREMENT,
			concept_id          INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
			word                TEXT NOT NULL,
			language            TEXT,
			ipa                 TEXT,
			nuance              TEXT,
			used_in_definition  INTEGER NOT NULL DEFAULT 0,
			created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}
	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("schema exec failed: %w\nSQL: %s", err, stmt)
		}
	}
	return nil
}

// ==================== User ====================

func FindUserByToken(db *sql.DB, token string) (*model.User, error) {
	var u model.User
	err := db.QueryRow(
		"SELECT id, username, token, created_at, expires_at FROM users WHERE token = ?",
		token,
	).Scan(&u.ID, &u.Username, &u.Token, &u.CreatedAt, &u.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &u, err
}

func FindUserByUsername(db *sql.DB, username string) (*model.User, error) {
	var u model.User
	err := db.QueryRow(
		"SELECT id, username, token, created_at, expires_at FROM users WHERE username = ?",
		username,
	).Scan(&u.ID, &u.Username, &u.Token, &u.CreatedAt, &u.ExpiresAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &u, err
}

func CreateUser(db *sql.DB, username, token string, expiresAt time.Time) (*model.User, error) {
	res, err := db.Exec(
		"INSERT INTO users (username, token, expires_at) VALUES (?, ?, ?)",
		username, token, expiresAt,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &model.User{
		ID:        id,
		Username:  username,
		Token:     token,
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
	}, nil
}

func UpdateUser(db *sql.DB, u *model.User) error {
	_, err := db.Exec(
		"UPDATE users SET token = ?, expires_at = ? WHERE id = ?",
		u.Token, u.ExpiresAt, u.ID,
	)
	return err
}

func InvalidateAllTokens(db *sql.DB) error {
	_, err := db.Exec(
		"UPDATE users SET expires_at = ?",
		time.Now().Add(-24*time.Hour),
	)
	return err
}

// ==================== Concept ====================

func CreateConcept(db *sql.DB, username, name string, notes *string) (*model.Concept, error) {
	res, err := db.Exec(
		"INSERT INTO concepts (username, name, notes) VALUES (?, ?, ?)",
		username, name, notes,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return GetConceptByID(db, id, username)
}

func ConceptExistsByUsernameAndName(db *sql.DB, username, name string) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM concepts WHERE username = ? AND name = ?",
		username, name,
	).Scan(&count)
	return count > 0, err
}

func GetConceptByID(db *sql.DB, id int64, username string) (*model.Concept, error) {
	var c model.Concept
	var notes sql.NullString
	err := db.QueryRow(
		"SELECT id, username, name, notes FROM concepts WHERE id = ? AND username = ?",
		id, username,
	).Scan(&c.ID, &c.Username, &c.Name, &notes)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if notes.Valid {
		c.Notes = &notes.String
	}
	words, err := GetWordsByConceptID(db, c.ID)
	if err != nil {
		return nil, err
	}
	c.Words = words
	return &c, nil
}

func GetAllConcepts(db *sql.DB, username string) ([]model.Concept, error) {
	rows, err := db.Query(
		"SELECT id, username, name, notes FROM concepts WHERE username = ? ORDER BY id DESC",
		username,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanConceptsWithWords(db, rows)
}

func GetAllConceptsWithQuery(db *sql.DB, username, query string) ([]model.Concept, error) {
	like := "%" + query + "%"
	rows, err := db.Query(
		`SELECT c.id, c.username, c.name, c.notes FROM concepts c
		 LEFT JOIN words w ON w.concept_id = c.id
		 WHERE c.username = ? AND (c.name LIKE ? OR c.notes LIKE ? OR w.word LIKE ?)
		 GROUP BY c.id
		 ORDER BY c.id DESC`,
		username, like, like, like,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanConceptsWithWords(db, rows)
}

func SearchConcepts(db *sql.DB, username, keyword string) ([]model.Concept, error) {
	like := "%" + keyword + "%"
	rows, err := db.Query(
		`SELECT c.id, c.username, c.name, c.notes FROM concepts c
		 LEFT JOIN words w ON w.concept_id = c.id
		 WHERE c.username = ? AND (c.name LIKE ? OR c.notes LIKE ? OR w.word LIKE ?)
		 GROUP BY c.id
		 ORDER BY c.id DESC`,
		username, like, like, like,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanConceptsWithWords(db, rows)
}

func scanConceptsWithWords(db *sql.DB, rows *sql.Rows) ([]model.Concept, error) {
	var concepts []model.Concept
	for rows.Next() {
		var c model.Concept
		var notes sql.NullString
		if err := rows.Scan(&c.ID, &c.Username, &c.Name, &notes); err != nil {
			return nil, err
		}
		if notes.Valid {
			c.Notes = &notes.String
		}
		words, err := GetWordsByConceptID(db, c.ID)
		if err != nil {
			return nil, err
		}
		c.Words = words
		concepts = append(concepts, c)
	}
	if concepts == nil {
		concepts = []model.Concept{}
	}
	return concepts, rows.Err()
}

func UpdateConcept(db *sql.DB, id int64, name string, notes *string, username string) (*model.Concept, error) {
	_, err := db.Exec(
		"UPDATE concepts SET name = ?, notes = ? WHERE id = ? AND username = ?",
		name, notes, id, username,
	)
	if err != nil {
		return nil, err
	}
	return GetConceptByID(db, id, username)
}

func DeleteConcept(db *sql.DB, id int64, username string) error {
	res, err := db.Exec("DELETE FROM concepts WHERE id = ? AND username = ?", id, username)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("not found")
	}
	return nil
}

// ==================== Word ====================

func GetWordsByConceptID(db *sql.DB, conceptID int64) ([]model.Word, error) {
	rows, err := db.Query(
		"SELECT id, word, language, ipa, nuance, used_in_definition FROM words WHERE concept_id = ?",
		conceptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var words []model.Word
	for rows.Next() {
		var w model.Word
		var ipa, nuance sql.NullString
		var usedInDef int
		if err := rows.Scan(&w.ID, &w.Word, &w.Language, &ipa, &nuance, &usedInDef); err != nil {
			return nil, err
		}
		if ipa.Valid {
			w.IPA = &ipa.String
		}
		if nuance.Valid {
			w.Nuance = &nuance.String
		}
		w.UsedInDefinition = usedInDef != 0
		words = append(words, w)
	}
	if words == nil {
		words = []model.Word{}
	}
	return words, rows.Err()
}

func GetWordByID(db *sql.DB, wordID int64) (*model.Word, error) {
	var w model.Word
	var ipa, nuance sql.NullString
	var usedInDef int
	err := db.QueryRow(
		"SELECT id, word, language, ipa, nuance, used_in_definition FROM words WHERE id = ?",
		wordID,
	).Scan(&w.ID, &w.Word, &w.Language, &ipa, &nuance, &usedInDef)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if ipa.Valid {
		w.IPA = &ipa.String
	}
	if nuance.Valid {
		w.Nuance = &nuance.String
	}
	w.UsedInDefinition = usedInDef != 0
	return &w, nil
}

func CreateWord(db *sql.DB, conceptID int64, w *model.Word) (*model.Word, error) {
	usedInDef := 0
	if w.UsedInDefinition {
		usedInDef = 1
	}
	res, err := db.Exec(
		"INSERT INTO words (concept_id, word, language, ipa, nuance, used_in_definition) VALUES (?, ?, ?, ?, ?, ?)",
		conceptID, w.Word, w.Language, w.IPA, w.Nuance, usedInDef,
	)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	w.ID = id
	return w, nil
}

func UpdateWord(db *sql.DB, wordID int64, w *model.Word) (*model.Word, error) {
	usedInDef := 0
	if w.UsedInDefinition {
		usedInDef = 1
	}
	_, err := db.Exec(
		"UPDATE words SET word = ?, language = ?, ipa = ?, nuance = ?, used_in_definition = ? WHERE id = ?",
		w.Word, w.Language, w.IPA, w.Nuance, usedInDef, wordID,
	)
	if err != nil {
		return nil, err
	}
	return GetWordByID(db, wordID)
}

func DeleteWord(db *sql.DB, wordID int64) error {
	res, err := db.Exec("DELETE FROM words WHERE id = ?", wordID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("not found")
	}
	return nil
}

// WordBelongsToConcept checks that a word belongs to the given concept.
func WordBelongsToConcept(db *sql.DB, wordID, conceptID int64) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM words WHERE id = ? AND concept_id = ?",
		wordID, conceptID,
	).Scan(&count)
	return count > 0, err
}

// ==================== Search (for cl-cli compatibility) ====================

// SearchConceptsByKeyword searches concepts and words by keyword (used by both
// authenticated search and public demo search).
func SearchConceptsByKeyword(db *sql.DB, username, keyword string) ([]model.Concept, error) {
	return SearchConcepts(db, username, keyword)
}

// ==================== Helpers ====================

func NullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}

func StringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func EscapeLike(s string) string {
	s = strings.ReplaceAll(s, "%", "\\%")
	s = strings.ReplaceAll(s, "_", "\\_")
	return s
}
