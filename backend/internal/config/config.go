package config

import "os"

type Config struct {
	Port      string
	JWTSecret string
	DBPath    string
}

func Load() *Config {
	return &Config{
		Port:      getEnv("PORT", "3001"),
		JWTSecret: getEnv("JWT_SECRET", "camp-secret-key"),
		DBPath:    getEnv("DB_PATH", "./camp.db"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
