package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"github.com/conceptlink/backend-go/db"
	"github.com/conceptlink/backend-go/handler"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	port := flag.String("port", "8080", "server port")
	dbPath := flag.String("db", "conceptlink.db", "SQLite database path")
	flag.Parse()

	// Allow env override
	if p := os.Getenv("PORT"); p != "" {
		*port = p
	}
	if d := os.Getenv("DB_PATH"); d != "" {
		*dbPath = d
	}

	database, err := db.Init(*dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	authHandler := &handler.AuthHandler{DB: database}
	conceptHandler := &handler.ConceptHandler{DB: database, Auth: authHandler}
	wordHandler := &handler.WordHandler{DB: database, Auth: authHandler}
	publicHandler := &handler.PublicHandler{DB: database}

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}))

	// Auth routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/verify-token", authHandler.VerifyToken)
		r.Post("/logout", authHandler.Logout)
		r.Post("/invalidate-all", authHandler.InvalidateAll)
	})

	// Concept routes
	r.Route("/api/concepts", func(r chi.Router) {
		r.Post("/", conceptHandler.Create)
		r.Get("/", conceptHandler.GetAll)
		r.Get("/search", conceptHandler.Search)
		r.Get("/{id}", conceptHandler.GetByID)
		r.Put("/{id}", conceptHandler.Update)
		r.Delete("/{id}", conceptHandler.Delete)

		// Word routes (nested under concepts)
		r.Route("/{conceptId}/words", func(r chi.Router) {
			r.Post("/", wordHandler.Create)
			r.Get("/", wordHandler.GetAll)
			r.Get("/{id}", wordHandler.GetByID)
			r.Put("/{id}", wordHandler.Update)
			r.Delete("/{id}", wordHandler.Delete)
		})
	})

	// Public routes
	r.Get("/api/public/demo-concepts/search", publicHandler.SearchDemoConcepts)

	log.Printf("ConceptLink Go backend starting on :%s", *port)
	if err := http.ListenAndServe(":"+*port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
