package config

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
}

type ServerConfig struct {
	Port string
	Mode string
}

type DatabaseConfig struct {
	Type     string
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type AuthConfig struct {
	JWTSecret string
}

func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: "8080",
			Mode: "debug",
		},
		Database: DatabaseConfig{
			Type: "sqlite",
			Name: "camp_system.db",
		},
		Auth: AuthConfig{
			JWTSecret: "camp-system-secret-key-2024",
		},
	}
}
