package auth

import (
	"camp-system/internal/model"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("camp-system-secret-key-2024")

type Claims struct {
	UserID   string      `json:"user_id"`
	Username string      `json:"username"`
	Name     string      `json:"name"`
	Role     model.Role  `json:"role"`
	CampIDs  []string    `json:"camp_ids"`
	jwt.RegisteredClaims
}

func GenerateToken(user *model.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Name:     user.Name,
		Role:     user.Role,
		CampIDs:  user.CampIDs,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "camp-system",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ParseToken(tokenString string) (*UserContext, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return &UserContext{
		UserID:   claims.UserID,
		Username: claims.Username,
		Name:     claims.Name,
		Role:     claims.Role,
		CampIDs:  claims.CampIDs,
	}, nil
}
