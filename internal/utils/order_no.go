package utils

import (
	"fmt"
	"math/rand"
	"time"
)

func GenerateOrderNo(prefix string) string {
	now := time.Now()
	random := rand.Intn(10000)
	return fmt.Sprintf("%s%s%04d", prefix, now.Format("20060102150405"), random)
}

func GenerateRefundNo() string {
	return GenerateOrderNo("RF")
}

func GenerateAppealNo() string {
	return GenerateOrderNo("AP")
}

func GenerateSubsidyNo() string {
	return GenerateOrderNo("SB")
}
