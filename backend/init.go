package main

import (
	"github.com/google/uuid"
)

func InitData() {
	var userCount int64
	DB.Model(&User{}).Count(&userCount)
	if userCount == 0 {
		users := []User{
			{ID: uuid.New().String(), Name: "张站长", Role: RoleStationMaster, Username: "zhang"},
			{ID: uuid.New().String(), Name: "李工", Role: RoleInspector, Username: "li"},
			{ID: uuid.New().String(), Name: "王内勤", Role: RoleAdmin, Username: "wang"},
		}
		DB.Create(&users)
	}

	var partCount int64
	DB.Model(&SparePart{}).Count(&partCount)
	if partCount == 0 {
		parts := []SparePart{
			{ID: uuid.New().String(), Name: "光伏组件", Model: "JKM395M-60HL4", Stock: 50, Unit: "块"},
			{ID: uuid.New().String(), Name: "逆变器", Model: "SUN-20K-G04", Stock: 10, Unit: "台"},
			{ID: uuid.New().String(), Name: "汇流箱", Model: "PV1000V-16/1", Stock: 20, Unit: "个"},
			{ID: uuid.New().String(), Name: "电缆接头", Model: "MC4", Stock: 200, Unit: "套"},
		}
		DB.Create(&parts)
	}
}
