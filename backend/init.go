package main

import (
	"time"

	"github.com/google/uuid"
)

func InitData() {
	var stationMaster User
	var inspector User
	var admin User

	var userCount int64
	DB.Model(&User{}).Count(&userCount)
	if userCount == 0 {
		stationMaster = User{ID: uuid.New().String(), Name: "张站长", Role: RoleStationMaster, Username: "zhang"}
		inspector = User{ID: uuid.New().String(), Name: "李工", Role: RoleInspector, Username: "li"}
		admin = User{ID: uuid.New().String(), Name: "王内勤", Role: RoleAdmin, Username: "wang"}
		DB.Create(&[]User{stationMaster, inspector, admin})
	} else {
		DB.Where("role = ?", RoleStationMaster).First(&stationMaster)
		DB.Where("role = ?", RoleInspector).First(&inspector)
		DB.Where("role = ?", RoleAdmin).First(&admin)
	}

	var partCount int64
	DB.Model(&SparePart{}).Count(&partCount)
	var parts []SparePart
	if partCount == 0 {
		parts = []SparePart{
			{ID: uuid.New().String(), Name: "光伏组件", Model: "JKM395M-60HL4", Stock: 50, Unit: "块"},
			{ID: uuid.New().String(), Name: "逆变器", Model: "SUN-20K-G04", Stock: 10, Unit: "台"},
			{ID: uuid.New().String(), Name: "汇流箱", Model: "PV1000V-16/1", Stock: 20, Unit: "个"},
			{ID: uuid.New().String(), Name: "电缆接头", Model: "MC4", Stock: 200, Unit: "套"},
		}
		DB.Create(&parts)
	} else {
		DB.Find(&parts)
	}

	var defectCount int64
	DB.Model(&Defect{}).Count(&defectCount)
	if defectCount == 0 {
		now := time.Now()

		pendingDefects := []Defect{
			{
				ID:           uuid.New().String(),
				Title:        "1号方阵组件发热异常",
				Description:  "巡检发现A3区第5排组件表面温度异常偏高，疑似热斑效应",
				Device:       "JKM395M-60HL4",
				Location:     "1号方阵-A3区",
				Priority:     "high",
				Status:       StatusPending,
				ReporterID:   inspector.ID,
				ReporterName: inspector.Name,
				CreatedAt:    now.Add(-2 * time.Hour),
				UpdatedAt:    now.Add(-2 * time.Hour),
			},
			{
				ID:           uuid.New().String(),
				Title:        "汇流箱通讯中断",
				Description:  "2号汇流箱监控数据无更新，通讯模块指示灯不亮",
				Device:       "PV1000V-16/1",
				Location:     "2号汇流箱",
				Priority:     "medium",
				Status:       StatusPending,
				ReporterID:   inspector.ID,
				ReporterName: inspector.Name,
				CreatedAt:    now.Add(-5 * time.Hour),
				UpdatedAt:    now.Add(-5 * time.Hour),
			},
			{
				ID:           uuid.New().String(),
				Title:        "逆变器异响",
				Description:  "3号逆变器运行时有异常噪音，输出功率波动",
				Device:       "SUN-20K-G04",
				Location:     "配电室-3号逆变器",
				Priority:     "low",
				Status:       StatusPending,
				ReporterID:   inspector.ID,
				ReporterName: inspector.Name,
				CreatedAt:    now.Add(-1 * time.Hour),
				UpdatedAt:    now.Add(-1 * time.Hour),
			},
		}
		DB.Create(&pendingDefects)

		rejectedDefect := Defect{
			ID:           uuid.New().String(),
			Title:        "接地电阻测试不合格",
			Description:  "接地电阻测试值4.5Ω，超出规范要求≤4Ω",
			Device:       "接地系统",
			Location:     "主接地网",
			Priority:     "high",
			Status:       StatusRejected,
			ReporterID:   inspector.ID,
			ReporterName: inspector.Name,
			AssigneeID:   inspector.ID,
			AssigneeName: inspector.Name,
			CreatedAt:    now.Add(-48 * time.Hour),
			UpdatedAt:    now.Add(-24 * time.Hour),
		}
		DB.Create(&rejectedDefect)

		rejectedHistory := DefectHistory{
			ID:           uuid.New().String(),
			DefectID:     rejectedDefect.ID,
			OldStatus:    StatusPendingReview,
			NewStatus:    StatusRejected,
			Action:       "驳回",
			OperatorID:   stationMaster.ID,
			OperatorName: stationMaster.Name,
			Remark:       "测试数据不完整，请补充测试点位置图和现场照片",
			CreatedAt:    now.Add(-24 * time.Hour),
		}
		DB.Create(&rejectedHistory)

		needReviewDefect := Defect{
			ID:           uuid.New().String(),
			Title:        "组件玻璃碎裂",
			Description:  "B2区第8排第12号组件玻璃碎裂",
			Device:       "JKM395M-60HL4",
			Location:     "1号方阵-B2区",
			Priority:     "high",
			Status:       StatusNeedReview,
			ReporterID:   inspector.ID,
			ReporterName: inspector.Name,
			AssigneeID:   inspector.ID,
			AssigneeName: inspector.Name,
			SpareParts:   "光伏组件 x1",
			DowntimeMinutes: 180,
			CreatedAt:    now.Add(-72 * time.Hour),
			UpdatedAt:    now.Add(-12 * time.Hour),
		}
		DB.Create(&needReviewDefect)

		reviewHistory := DefectHistory{
			ID:           uuid.New().String(),
			DefectID:     needReviewDefect.ID,
			OldStatus:    StatusPendingReview,
			NewStatus:    StatusNeedReview,
			Action:       "标记需回查",
			OperatorID:   stationMaster.ID,
			OperatorName: stationMaster.Name,
			Remark:       "已更换组件，一周后回访确认发电效率",
			CreatedAt:    now.Add(-12 * time.Hour),
		}
		DB.Create(&reviewHistory)

		inProgressDefect := Defect{
			ID:           uuid.New().String(),
			Title:        "MC4接头老化",
			Description:  "多处电缆接头出现老化迹象，需要更换",
			Device:       "MC4",
			Location:     "2号方阵-C区",
			Priority:     "medium",
			Status:       StatusInProgress,
			ReporterID:   inspector.ID,
			ReporterName: inspector.Name,
			AssigneeID:   inspector.ID,
			AssigneeName: inspector.Name,
			CreatedAt:    now.Add(-6 * time.Hour),
			UpdatedAt:    now.Add(-3 * time.Hour),
		}
		DB.Create(&inProgressDefect)
	}
}
