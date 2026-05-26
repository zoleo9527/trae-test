package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret      string
	JWTExpireHours int

	ServerHost string
	ServerPort string

	AsyncWorkerCount int
	ExportDir        string
}

var AppConfig *Config

func Load() error {
	_ = godotenv.Load()

	expireHours, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "24"))
	workerCount, _ := strconv.Atoi(getEnv("ASYNC_WORKER_COUNT", "3"))

	AppConfig = &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "tea_distribution"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:      getEnv("JWT_SECRET", "dev-secret"),
		JWTExpireHours: expireHours,

		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort: getEnv("SERVER_PORT", "8080"),

		AsyncWorkerCount: workerCount,
		ExportDir:        getEnv("EXPORT_DIR", "./exports"),
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func (c *Config) GetDSN() string {
	return "host=" + c.DBHost + " port=" + c.DBPort + " user=" + c.DBUser +
		" password=" + c.DBPassword + " dbname=" + c.DBName + " sslmode=" + c.DBSSLMode
}
