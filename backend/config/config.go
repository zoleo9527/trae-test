package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
	PostgresSSLMode  string
	JWTSecret        string
	JWTExpireHours   int
	ServerHost       string
	ServerPort       string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	expireHours, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "24"))

	return &Config{
		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),
		PostgresUser:     getEnv("POSTGRES_USER", "gallery"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", "gallery123"),
		PostgresDB:       getEnv("POSTGRES_DB", "gallery_db"),
		PostgresSSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),
		JWTSecret:        getEnv("JWT_SECRET", "gallery_jwt_secret_key_2024"),
		JWTExpireHours:   expireHours,
		ServerHost:       getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort:       getEnv("SERVER_PORT", "8080"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func (c *Config) GetDSN() string {
	return "host=" + c.PostgresHost +
		" port=" + c.PostgresPort +
		" user=" + c.PostgresUser +
		" password=" + c.PostgresPassword +
		" dbname=" + c.PostgresDB +
		" sslmode=" + c.PostgresSSLMode
}
