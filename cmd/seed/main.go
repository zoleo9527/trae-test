package main

import (
	"context"
	"log"
	"os"

	"swimclub/internal/config"
	"swimclub/internal/db"
	"swimclub/internal/migrate"
	"swimclub/internal/seed"
)

func main() {
	cfg := config.Load()
	pg, err := db.Open(cfg.DBURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pg.Close()

	cwd, _ := os.Getwd()
	if err := migrate.RunMigrations(pg, cwd); err != nil {
		log.Fatalf("migrations: %v", err)
	}
	if err := seed.Run(context.Background(), pg); err != nil {
		log.Fatalf("seed: %v", err)
	}
	log.Println("seeded ok")
}
