package config

import "os"

type Config struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	JWTExpireHours  string
	UploadDir       string
	AllowedOrigins  string
}

func Load() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/cultural_store?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		JWTExpireHours: getEnv("JWT_EXPIRE_HOURS", "72"),
		UploadDir:      getEnv("UPLOAD_DIR", "./uploads"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "*"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
