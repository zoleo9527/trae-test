package middleware

import (
	"strconv"
	"strings"

	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func JWTAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "missing authorization header"})
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(401).JSON(fiber.Map{"error": "invalid authorization format"})
		}
		token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(401, "unexpected signing method")
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "invalid or expired token"})
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token claims"})
		}
		c.Locals("user_id", claims["sub"])
		c.Locals("username", claims["username"])
		c.Locals("display_name", claims["display_name"])
		c.Locals("role", claims["role"])
		if sid, ok := claims["store_id"]; ok && sid != nil {
			c.Locals("store_id", sid)
		}
		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("role").(string)
		for _, r := range roles {
			if userRole == r {
				return c.Next()
			}
		}
		return c.Status(403).JSON(fiber.Map{"error": "insufficient permissions"})
	}
}

func Paginate() fiber.Handler {
	return func(c *fiber.Ctx) error {
		page, _ := strconv.Atoi(c.Query("page", "1"))
		pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
		if page < 1 {
			page = 1
		}
		if pageSize < 1 {
			pageSize = 20
		}
		if pageSize > 100 {
			pageSize = 100
		}
		c.Locals("page", page)
		c.Locals("page_size", pageSize)
		return c.Next()
	}
}

func GetFilter(c *fiber.Ctx) model.ListFilter {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	storeID := c.Query("store_id", "")
	if injected, ok := c.Locals("effective_store_id").(string); ok && injected != "" {
		storeID = injected
	}
	return model.ListFilter{
		Page:     page,
		PageSize: pageSize,
		StoreID:  storeID,
		Status:   c.Query("status", ""),
		Search:   c.Query("search", ""),
		SortBy:   c.Query("sort_by", "created_at"),
		SortDir:  c.Query("sort_dir", "desc"),
	}
}

func InjectStoreID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		if role == "store_manager" {
			if storeID, ok := c.Locals("store_id").(string); ok && storeID != "" {
				c.Locals("effective_store_id", storeID)
				storeFilter := c.Query("store_id")
				if storeFilter != "" && storeFilter != storeID {
					return c.Status(403).JSON(fiber.Map{"error": "store_id mismatch: can only access your own store"})
				}
			}
		}
		return c.Next()
	}
}

func GetEffectiveStoreID(c *fiber.Ctx) string {
	if injected, ok := c.Locals("effective_store_id").(string); ok && injected != "" {
		return injected
	}
	return ""
}

func CORS(allowedOrigins string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		if allowedOrigins == "*" || origin == "" {
			c.Set("Access-Control-Allow-Origin", "*")
		} else {
			for _, o := range strings.Split(allowedOrigins, ",") {
				if strings.TrimSpace(o) == origin {
					c.Set("Access-Control-Allow-Origin", origin)
					break
				}
			}
		}
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin,Content-Type,Accept,Authorization")
		c.Set("Access-Control-Allow-Credentials", "true")
		c.Set("Access-Control-Max-Age", "86400")
		if c.Method() == "OPTIONS" {
			return c.SendStatus(204)
		}
		return c.Next()
	}
}
