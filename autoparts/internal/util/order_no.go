package util

import (
	"fmt"
	"math/rand"
	"time"
)

func GenerateEnquiryNo() string {
	return fmt.Sprintf("ENQ%s%04d", time.Now().Format("200601021504"), rand.Intn(10000))
}

func GenerateQuoteNo() string {
	return fmt.Sprintf("QOT%s%04d", time.Now().Format("200601021504"), rand.Intn(10000))
}

func GenerateLockNo() string {
	return fmt.Sprintf("LCK%s%04d", time.Now().Format("200601021504"), rand.Intn(10000))
}

func GenerateTaskNo() string {
	return fmt.Sprintf("TSK%s%04d", time.Now().Format("200601021504"), rand.Intn(10000))
}
