package api

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"carwash-system/middleware"
	"carwash-system/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm/clause"
)

func GetActivities(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	typ := c.Query("type")

	query := models.DB.Model(&models.Activity{}).Preload("Creator")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if typ != "" {
		query = query.Where("type = ?", typ)
	}

	var total int64
	query.Count(&total)

	var activities []models.Activity
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&activities)

	return c.JSON(fiber.Map{
		"items": activities,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func GetActivityDetail(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var activity models.Activity
	if err := models.DB.Preload("Creator").First(&activity, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "活动不存在"})
	}
	return c.JSON(activity)
}

func CreateActivity(c *fiber.Ctx) error {
	var activity models.Activity
	if err := c.BodyParser(&activity); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	user := middleware.GetCurrentUser(c)
	activity.CreatorID = user.UserID
	activity.Status = "pending"

	if err := models.DB.Create(&activity).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "创建失败"})
	}

	return c.JSON(activity)
}

func UpdateActivity(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var activity models.Activity
	if err := models.DB.First(&activity, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "活动不存在"})
	}

	if err := c.BodyParser(&activity); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	models.DB.Save(&activity)
	return c.JSON(activity)
}

type PushActivityRequest struct {
	MemberIDs []uint `json:"member_ids"`
	Channel   string `json:"channel"`
}

func PushActivity(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var activity models.Activity
	if err := models.DB.First(&activity, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "活动不存在"})
	}

	var req PushActivityRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	if len(req.MemberIDs) == 0 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "请选择推送会员"})
	}

	user := middleware.GetCurrentUser(c)
	levelMap := map[string]int{"normal": 0, "silver": 1, "gold": 2, "platinum": 3}
	minLevelValue := levelMap[activity.MinLevel]

	var targetTags []string
	if activity.TargetTags != "" {
		for _, t := range strings.Split(activity.TargetTags, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				targetTags = append(targetTags, t)
			}
		}
	}

	tx := models.DB.Begin()

	var existingPushedIDs []uint
	tx.Model(&models.ActivityPush{}).
		Where("activity_id = ? AND member_id IN ?", id, req.MemberIDs).
		Pluck("member_id", &existingPushedIDs)
	existingPushedSet := make(map[uint]bool)
	for _, mid := range existingPushedIDs {
		existingPushedSet[mid] = true
	}

	var members []models.Member
	tx.Where("id IN ?", req.MemberIDs).Find(&members)
	memberMap := make(map[uint]models.Member)
	for _, m := range members {
		memberMap[m.ID] = m
	}

	now := time.Now()
	var pushes []models.ActivityPush
	skippedCount := 0

	for _, memberID := range req.MemberIDs {
		if existingPushedSet[memberID] {
			skippedCount++
			continue
		}

		member, exists := memberMap[memberID]
		if !exists {
			skippedCount++
			continue
		}

		memberLevelValue := levelMap[member.Level]
		if memberLevelValue < minLevelValue {
			skippedCount++
			continue
		}

		if len(targetTags) > 0 {
			hasMatch := false
			for _, tag := range targetTags {
				if strings.Contains(member.Tags, tag) {
					hasMatch = true
					break
				}
			}
			if !hasMatch {
				skippedCount++
				continue
			}
		}

		pushes = append(pushes, models.ActivityPush{
			ActivityID: uint(id),
			MemberID:   memberID,
			PushTime:   now,
			ReadStatus: "unread",
			Channel:    req.Channel,
		})
	}

	successCount := 0
	if len(pushes) > 0 {
		result := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "activity_id"}, {Name: "member_id"}},
			DoNothing: true,
		}).Create(&pushes)
		successCount = int(result.RowsAffected)
	}

	if activity.Status == "pending" && successCount > 0 {
		activity.Status = "active"
		tx.Save(&activity)
	}

	tx.Create(&models.TicketLog{
		TicketType: "activity",
		TicketID:   uint(id),
		Action:     "push",
		OperatorID: user.UserID,
		Remark:     "推送活动给" + strconv.Itoa(successCount) + "位会员（跳过" + strconv.Itoa(skippedCount) + "位）",
	})

	tx.Commit()

	return c.JSON(fiber.Map{
		"success":         true,
		"count":           successCount,
		"skipped_count":   skippedCount,
		"activity_status": activity.Status,
	})
}

func GetActivityStats(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var totalPushes int64
	models.DB.Model(&models.ActivityPush{}).Where("activity_id = ?", id).Count(&totalPushes)

	var readCount int64
	models.DB.Model(&models.ActivityPush{}).Where("activity_id = ? AND read_status = ?", id, "read").Count(&readCount)

	var totalMembers int64
	models.DB.Model(&models.Member{}).Where("status = ?", "active").Count(&totalMembers)

	var pushedMemberIDs []uint
	models.DB.Model(&models.ActivityPush{}).Where("activity_id = ?", id).Pluck("member_id", &pushedMemberIDs)

	readRate := 0.0
	if totalPushes > 0 {
		readRate = float64(readCount) / float64(totalPushes) * 100
	}

	return c.JSON(fiber.Map{
		"total_pushes":  totalPushes,
		"read_count":    readCount,
		"read_rate":     readRate,
		"total_members": totalMembers,
		"coverage_rate": float64(totalPushes) / float64(totalMembers) * 100,
		"member_ids":    pushedMemberIDs,
	})
}

func GetSites(c *fiber.Ctx) error {
	var sites []models.Site
	models.DB.Find(&sites)
	return c.JSON(sites)
}

func GetSiteDevices(c *fiber.Ctx) error {
	siteID, _ := strconv.Atoi(c.Params("id"))
	var devices []models.Device
	models.DB.Where("site_id = ?", siteID).Find(&devices)
	return c.JSON(devices)
}

func GetDevices(c *fiber.Ctx) error {
	status := c.Query("status")
	siteID := c.Query("site_id")

	query := models.DB.Model(&models.Device{}).Preload("Site")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if siteID != "" {
		query = query.Where("site_id = ?", siteID)
	}

	var devices []models.Device
	query.Find(&devices)
	return c.JSON(devices)
}
