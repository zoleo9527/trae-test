package main

import (
	"database/sql"
	"os"

	"swimclub/internal/migrate"
)

func runMigrations(db *sql.DB) error {
	cwd, _ := os.Getwd()
	return migrate.RunMigrations(db, cwd)
}
