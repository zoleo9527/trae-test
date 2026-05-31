package repository

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func Init(database *gorm.DB) {
	db = database
}

func Paginate(page, pageSize int) (int, int) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize
	return offset, pageSize
}

func CountAndPaginate(tx *gorm.DB, page, pageSize int) (int64, *gorm.DB) {
	var total int64
	tx.Count(&total)
	offset, limit := Paginate(page, pageSize)
	return total, tx.Offset(offset).Limit(limit)
}
