package router

import (
	"camp-system/internal/auth"
	"camp-system/internal/handler"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	authHandler := handler.NewAuthHandler()
	dashboardHandler := handler.NewDashboardHandler()
	checkInHandler := handler.NewCheckInHandler()
	medicalHandler := handler.NewMedicalHandler()
	camperHandler := handler.NewCamperHandler()
	logHandler := handler.NewLogHandler()

	api := r.Group("/api/v1")
	{
		api.POST("/auth/login", authHandler.Login)

		authorized := api.Group("/")
		authorized.Use(auth.AuthMiddleware())
		{
			authorized.GET("/auth/me", authHandler.GetCurrentUser)
			authorized.POST("/auth/logout", authHandler.Logout)

			authorized.GET("/dashboard", auth.PermissionMiddleware(auth.PermDashboard), dashboardHandler.GetDashboard)

			checkin := authorized.Group("/checkin")
			checkin.Use(auth.PermissionMiddleware(auth.PermCheckInView))
			{
				checkin.POST("/batch", auth.PermissionMiddleware(auth.PermCheckInManage), checkInHandler.BatchCheckIn)
				checkin.GET("/activity/:activity_id", checkInHandler.GetActivityCheckIns)
				checkin.GET("/activity/:activity_id/statistics", checkInHandler.GetCheckInStatistics)
				checkin.GET("/camper/:camper_id", checkInHandler.GetCamperCheckIns)
			}

			medical := authorized.Group("/medical")
			medical.Use(auth.PermissionMiddleware(auth.PermMedicalView))
			{
				medical.POST("", auth.PermissionMiddleware(auth.PermMedicalManage), medicalHandler.CreateMedicalReport)
				medical.PUT("/:id/status", auth.PermissionMiddleware(auth.PermMedicalManage), medicalHandler.UpdateMedicalStatus)
				medical.POST("/:id/notify-parent", auth.PermissionMiddleware(auth.PermMedicalManage), medicalHandler.NotifyParent)
				medical.GET("/:id", medicalHandler.GetMedicalReport)
				medical.GET("", medicalHandler.GetCampMedicalReports)
				medical.GET("/camper/:camper_id", medicalHandler.GetCamperMedicalReports)
				medical.GET("/statistics", medicalHandler.GetMedicalStatistics)
			}

			camper := authorized.Group("/campers")
			camper.Use(auth.PermissionMiddleware(auth.PermCamperView))
			{
				camper.GET("", camperHandler.GetCampers)
				camper.GET("/:id", camperHandler.GetCamper)
				camper.GET("/:id/history", camperHandler.GetCamperHistory)
			}

			logs := authorized.Group("/logs")
			logs.Use(auth.PermissionMiddleware(auth.PermLogView))
			{
				logs.GET("/operations", logHandler.GetOperationLogs)
				logs.GET("/status/:entity_type/:entity_id", logHandler.GetEntityStatusHistory)
			}
		}
	}

	return r
}
