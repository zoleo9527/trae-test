package auth

import (
	"camp-system/internal/model"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Permission string

const (
	PermCampView        Permission = "camp:view"
	PermCampManage      Permission = "camp:manage"
	PermCamperView      Permission = "camper:view"
	PermCamperManage    Permission = "camper:manage"
	PermCheckInView     Permission = "checkin:view"
	PermCheckInManage   Permission = "checkin:manage"
	PermMedicalView     Permission = "medical:view"
	PermMedicalManage   Permission = "medical:manage"
	PermRoomView        Permission = "room:view"
	PermRoomManage      Permission = "room:manage"
	PermMaterialView    Permission = "material:view"
	PermMaterialRequest Permission = "material:request"
	PermMaterialManage  Permission = "material:manage"
	PermFollowUpView    Permission = "followup:view"
	PermFollowUpManage  Permission = "followup:manage"
	PermLogView         Permission = "log:view"
	PermUserManage      Permission = "user:manage"
	PermDashboard       Permission = "dashboard:view"
)

var rolePermissions = map[model.Role][]Permission{
	model.RoleDirector: {
		PermCampView, PermCampManage,
		PermCamperView, PermCamperManage,
		PermCheckInView, PermCheckInManage,
		PermMedicalView, PermMedicalManage,
		PermRoomView, PermRoomManage,
		PermMaterialView, PermMaterialRequest, PermMaterialManage,
		PermFollowUpView, PermFollowUpManage,
		PermLogView, PermDashboard,
		PermUserManage,
	},
	model.RoleTeacher: {
		PermCampView,
		PermCamperView,
		PermCheckInView, PermCheckInManage,
		PermMedicalView, PermMedicalManage,
		PermRoomView,
		PermFollowUpView, PermFollowUpManage,
		PermMaterialView, PermMaterialRequest,
		PermDashboard,
	},
	model.RoleLogistics: {
		PermCampView,
		PermCamperView,
		PermRoomView, PermRoomManage,
		PermMaterialView, PermMaterialManage,
		PermCheckInView,
		PermFollowUpView,
		PermLogView, PermDashboard,
	},
	model.RoleMedical: {
		PermCampView,
		PermCamperView,
		PermMedicalView, PermMedicalManage,
		PermCheckInView, PermCheckInManage,
		PermFollowUpView, PermFollowUpManage,
		PermMaterialView, PermMaterialRequest,
		PermLogView, PermDashboard,
	},
	model.RoleAdmin: {
		PermCampView, PermCampManage,
		PermCamperView, PermCamperManage,
		PermCheckInView, PermCheckInManage,
		PermMedicalView, PermMedicalManage,
		PermRoomView, PermRoomManage,
		PermMaterialView, PermMaterialRequest, PermMaterialManage,
		PermFollowUpView, PermFollowUpManage,
		PermLogView, PermDashboard,
		PermUserManage,
	},
}

func HasPermission(role model.Role, perm Permission) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

func GetRolePermissions(role model.Role) []Permission {
	return rolePermissions[role]
}

type UserContext struct {
	UserID   string
	Username string
	Name     string
	Role     model.Role
	CampIDs  []string
}

const UserContextKey = "user_context"

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供认证信息"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "认证格式错误"})
			c.Abort()
			return
		}

		token := parts[1]
		userCtx, err := ParseToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "认证无效: " + err.Error()})
			c.Abort()
			return
		}

		c.Set(UserContextKey, userCtx)
		c.Next()
	}
}

func PermissionMiddleware(perm Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		userCtx, exists := c.Get(UserContextKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
			c.Abort()
			return
		}

		uc, ok := userCtx.(*UserContext)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "认证信息无效"})
			c.Abort()
			return
		}

		if !HasPermission(uc.Role, perm) {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func RoleMiddleware(roles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userCtx, exists := c.Get(UserContextKey)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
			c.Abort()
			return
		}

		uc, ok := userCtx.(*UserContext)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "认证信息无效"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if uc.Role == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "角色权限不足"})
		c.Abort()
	}
}

func GetCurrentUser(c *gin.Context) *UserContext {
	userCtx, exists := c.Get(UserContextKey)
	if !exists {
		return nil
	}
	uc, ok := userCtx.(*UserContext)
	if !ok {
		return nil
	}
	return uc
}

func GetCurrentUserID(c *gin.Context) string {
	uc := GetCurrentUser(c)
	if uc == nil {
		return ""
	}
	return uc.UserID
}

func (u *UserContext) HasCampAccess(campID string) bool {
	if u.Role == model.RoleAdmin || u.Role == model.RoleDirector {
		return true
	}
	for _, cid := range u.CampIDs {
		if cid == campID {
			return true
		}
	}
	return false
}
