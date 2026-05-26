package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppName     string
	Port        string
	DBURL       string
	JWTSecret   []byte
	JWTExpire   time.Duration
	SeedOnBoot  bool
}

func Load() Config {
	expire, _ := time.ParseDuration(getenv("JWT_EXPIRE", "24h"))
	seed, _ := strconv.ParseBool(getenv("SEED_ON_BOOT", "true"))
	return Config{
		AppName:    getenv("APP_NAME", "swimclub"),
		Port:       getenv("PORT", "8080"),
		DBURL:      getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/swimclub?sslmode=disable"),
		JWTSecret:  []byte(getenv("JWT_SECRET", "change-me-in-production-32bytes-min!")),
		JWTExpire:  expire,
		SeedOnBoot: seed,
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
