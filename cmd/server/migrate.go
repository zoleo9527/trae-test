package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/lib/pq"
)

// runMigrations applies all files under migrations/ in alphabetical order.
// It keeps a simple bookkeeping table to avoid re-running.
func runMigrations(db *sql.DB) error {
	if _, err := db.ExecContext(context.Background(), `
		CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())
	`); err != nil {
		return err
	}
	dir := "migrations"
	entries, err := os.ReadDir(dir)
	if err != nil {
		// fallback: try relative to cwd
		if wd, err2 := os.Getwd(); err2 == nil {
			entries, err = os.ReadDir(filepath.Join(wd, dir))
		}
		if err != nil {
			return fmt.Errorf("read migrations dir: %w", err)
		}
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		var n int
		db.QueryRowContext(context.Background(), `SELECT count(*) FROM schema_migrations WHERE name=$1`, e.Name()).Scan(&n)
		if n > 0 {
			continue
		}
		b, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			return err
		}
		if _, err := db.ExecContext(context.Background(), string(b)); err != nil {
			// ignore duplicate-relation errors so re-runs are safe
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "42P07" {
				// already exists
			} else {
				return fmt.Errorf("migration %s: %w", e.Name(), err)
			}
		}
		db.ExecContext(context.Background(), `INSERT INTO schema_migrations(name) VALUES($1) ON CONFLICT DO NOTHING`, e.Name())
	}
	return nil
}
