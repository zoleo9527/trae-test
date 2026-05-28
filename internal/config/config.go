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
UploadDir        string
MaxUploadSize    int64
}

var AppConfig *Config

func Load() error {
_ = godotenv.Load()
expireHours, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "24"))
workerCount, _ := strconv.Atoi(getEnv("ASYNC_WORKER_COUNT", "3"))
maxUploadSize, _ := strconv.ParseInt(getEnv("MAX_UPLOAD_SIZE", "10485760"), 10, 64)
AppConfig = &Config{
DBHost:     getEnv("DB_HOST", "localhost"),
DBPort:     getEnv("DB_PORT", "5432"),
DBUser:     getEnv("DB_USER", "postgres"),
DBPassword: getEnv("DB_PASSWORD", "postgres"),
DBName:     getEnv("DB_NAME", "water_delivery"),
DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
JWTSecret:      getEnv("JWT_SECRET", "default-secret"),
JWTExpireHours: expireHours,
ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
ServerPort: getEnv("SERVER_PORT", "3000"),
AsyncWorkerCount: workerCount,
UploadDir:        getEnv("UPLOAD_DIR", "./uploads"),
MaxUploadSize:    maxUploadSize,
}
return nil
}

func getEnv(key, defaultValue string) string {
value := os.Getenv(key)
if value == "" {
return defaultValue
}
return value
}

func (c *Config) GetDSN() string {
return "host=" + c.DBHost + " port=" + c.DBPort + " user=" + c.DBUser + " password=" + c.DBPassword + " dbname=" + c.DBName + " sslmode=" + c.DBSSLMode
}
