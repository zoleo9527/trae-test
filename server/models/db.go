package models

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	var err error
	DB, err = gorm.Open(sqlite.Open("carwash.db"), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		panic("failed to connect database")
	}

	err = DB.AutoMigrate(
		&User{},
		&Member{},
		&MembershipPackage{},
		&MembershipOrder{},
		&Device{},
		&RepairOrder{},
		&RefundRequest{},
		&Activity{},
		&ActivityPush{},
		&Site{},
		&TicketLog{},
	)
	if err != nil {
		panic("failed to migrate database")
	}
}

type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type User struct {
	BaseModel
	Username string `gorm:"uniqueIndex;size:50" json:"username"`
	Password string `json:"-"`
	Role     string `gorm:"size:20" json:"role"`
	Name     string `gorm:"size:50" json:"name"`
	Avatar   string `json:"avatar"`
}

type Member struct {
	BaseModel
	Phone              string    `gorm:"uniqueIndex;size:20" json:"phone"`
	Name               string    `gorm:"size:50" json:"name"`
	Level              string    `gorm:"size:20" json:"level"`
	Points             int       `json:"points"`
	Balance            float64   `json:"balance"`
	MembershipExpireAt time.Time `json:"membership_expire_at"`
	Tags               string    `json:"tags"`
	Status             string    `gorm:"size:20" json:"status"`
	TotalOrders        int       `json:"total_orders"`
	TotalAmount        float64   `json:"total_amount"`
}

type MembershipPackage struct {
	BaseModel
	Name          string  `gorm:"size:100" json:"name"`
	Duration      int     `json:"duration"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"original_price"`
	Description   string  `json:"description"`
	Status        string  `gorm:"size:20" json:"status"`
	SortOrder     int     `json:"sort_order"`
}

type MembershipOrder struct {
	BaseModel
	MemberID       uint              `json:"member_id"`
	Member         Member            `gorm:"foreignKey:MemberID" json:"member"`
	PackageID      uint              `json:"package_id"`
	Package        MembershipPackage `gorm:"foreignKey:PackageID" json:"package"`
	OrderNo        string            `gorm:"uniqueIndex;size:50" json:"order_no"`
	Amount         float64           `json:"amount"`
	PaymentMethod  string            `gorm:"size:20" json:"payment_method"`
	Status         string            `gorm:"size:20" json:"status"`
	ExtendDuration int               `json:"extend_duration"`
	OperatorID     uint              `json:"operator_id"`
	Operator       User              `gorm:"foreignKey:OperatorID" json:"operator"`
	Remark         string            `json:"remark"`
	PaymentTime    *time.Time        `json:"payment_time"`
}

type Site struct {
	BaseModel
	Name        string `gorm:"size:100" json:"name"`
	Address     string `json:"address"`
	City        string `gorm:"size:50" json:"city"`
	Status      string `gorm:"size:20" json:"status"`
	DeviceCount int    `json:"device_count"`
	Manager     string `gorm:"size:50" json:"manager"`
	Phone       string `gorm:"size:20" json:"phone"`
}

type Device struct {
	BaseModel
	SiteID          uint      `json:"site_id"`
	Site            Site      `gorm:"foreignKey:SiteID" json:"site"`
	DeviceNo        string    `gorm:"uniqueIndex;size:50" json:"device_no"`
	Name            string    `gorm:"size:100" json:"name"`
	Type            string    `gorm:"size:20" json:"type"`
	Status          string    `gorm:"size:20" json:"status"`
	LastMaintenance time.Time `json:"last_maintenance"`
	Location        string    `json:"location"`
}

type RepairOrder struct {
	BaseModel
	DeviceID    uint   `json:"device_id"`
	Device      Device `gorm:"foreignKey:DeviceID" json:"device"`
	ReporterID  uint   `json:"reporter_id"`
	Reporter    User   `gorm:"foreignKey:ReporterID" json:"reporter"`
	HandlerID   *uint  `json:"handler_id"`
	Handler     *User  `gorm:"foreignKey:HandlerID" json:"handler"`
	Title       string `gorm:"size:200" json:"title"`
	Description string `json:"description"`
	Photos      string `json:"photos"`
	Priority    string `gorm:"size:20" json:"priority"`
	Status      string `gorm:"size:20" json:"status"`
	Level       int    `json:"level"`
	Remark      string `json:"remark"`
}

type RefundRequest struct {
	BaseModel
	MemberID      uint       `json:"member_id"`
	Member        Member     `gorm:"foreignKey:MemberID" json:"member"`
	OrderNo       string     `gorm:"size:50" json:"order_no"`
	Amount        float64    `json:"amount"`
	Reason        string     `json:"reason"`
	Evidence      string     `json:"evidence"`
	ApplicantID   uint       `json:"applicant_id"`
	Applicant     User       `gorm:"foreignKey:ApplicantID" json:"applicant"`
	ReviewerID    *uint      `json:"reviewer_id"`
	Reviewer      *User      `gorm:"foreignKey:ReviewerID" json:"reviewer"`
	Status        string     `gorm:"size:20" json:"status"`
	ReviewOpinion string     `json:"review_opinion"`
	RefundTime    *time.Time `json:"refund_time"`
}

type Activity struct {
	BaseModel
	Name         string    `gorm:"size:200" json:"name"`
	Type         string    `gorm:"size:20" json:"type"`
	Description  string    `json:"description"`
	CoverImage   string    `json:"cover_image"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	TargetTags   string    `json:"target_tags"`
	TargetCities string    `json:"target_cities"`
	MinLevel     string    `gorm:"size:20" json:"min_level"`
	Discount     float64   `json:"discount"`
	CouponAmount float64   `json:"coupon_amount"`
	Status       string    `gorm:"size:20" json:"status"`
	CreatorID    uint      `json:"creator_id"`
	Creator      User      `gorm:"foreignKey:CreatorID" json:"creator"`
}

type ActivityPush struct {
	BaseModel
	ActivityID uint       `gorm:"uniqueIndex:idx_activity_member;index" json:"activity_id"`
	Activity   Activity   `gorm:"foreignKey:ActivityID" json:"activity"`
	MemberID   uint       `gorm:"uniqueIndex:idx_activity_member;index" json:"member_id"`
	Member     Member     `gorm:"foreignKey:MemberID" json:"member"`
	PushTime   time.Time  `json:"push_time"`
	ReadStatus string     `gorm:"size:20" json:"read_status"`
	ReadTime   *time.Time `json:"read_time"`
	Channel    string     `gorm:"size:20" json:"channel"`
}

type TicketLog struct {
	BaseModel
	TicketType string `gorm:"size:20" json:"ticket_type"`
	TicketID   uint   `json:"ticket_id"`
	Action     string `gorm:"size:50" json:"action"`
	OperatorID uint   `json:"operator_id"`
	Operator   User   `gorm:"foreignKey:OperatorID" json:"operator"`
	Remark     string `json:"remark"`
	OldStatus  string `gorm:"size:20" json:"old_status"`
	NewStatus  string `gorm:"size:20" json:"new_status"`
}
