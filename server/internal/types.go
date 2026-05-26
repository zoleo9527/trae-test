package internal

type Role string

const (
	RoleManager Role = "manager"
	RoleEditor  Role = "editor"
	RoleService Role = "service"
)

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"`
	Name     string `json:"name"`
	Role     Role   `json:"role"`
}

type Session struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type PhotoSlot struct {
	ID         string `json:"id"`
	At         string `json:"at"`
	Place      string `json:"place"`
	Photographer string `json:"photographer"`
}

type Selection struct {
	ID         string   `json:"id"`
	Version    int      `json:"version"`
	CreatedAt  string   `json:"createdAt"`
	Photos     []string `json:"photos"`
	EditorID   string   `json:"editorId"`
	EditorName string   `json:"editorName"`
	Confirmed  bool     `json:"confirmed"`
	Note       string   `json:"note"`
}

type Payment struct {
	ID        string `json:"id"`
	Stage     string `json:"stage"`
	Amount    int    `json:"amount"`
	Paid      bool   `json:"paid"`
	DueAt     string `json:"dueAt"`
	PaidAt    string `json:"paidAt,omitempty"`
	Note      string `json:"note"`
}

type ExceptionItem struct {
	ID        string `json:"id"`
	OrderID   string `json:"orderId"`
	Kind      string `json:"kind"`
	Severity  string `json:"severity"`
	Status    string `json:"status"`
	Summary   string `json:"summary"`
	Detail    string `json:"detail"`
	CreatedAt string `json:"createdAt"`
	ClosedAt  string `json:"closedAt,omitempty"`
	HandledBy string `json:"handledBy,omitempty"`
}

type TimelineEvent struct {
	ID        string `json:"id"`
	At        string `json:"at"`
	Stage     string `json:"stage"`
	Actor     string `json:"actor"`
	Action    string `json:"action"`
	Detail    string `json:"detail"`
}

type Order struct {
	ID             string          `json:"id"`
	No             string          `json:"no"`
	CustomerName   string          `json:"customerName"`
	CustomerPhone  string          `json:"customerPhone"`
	Package        string          `json:"package"`
	ManagerID      string          `json:"managerId"`
	ManagerName    string          `json:"managerName"`
	EditorID       string          `json:"editorId"`
	EditorName     string          `json:"editorName"`
	ServiceID      string          `json:"serviceId"`
	ServiceName    string          `json:"serviceName"`
	Slots          []PhotoSlot     `json:"slots"`
	Selections     []Selection     `json:"selections"`
	Payments       []Payment       `json:"payments"`
	Exceptions     []ExceptionItem `json:"exceptions"`
	Timeline       []TimelineEvent `json:"timeline"`
	Status         string          `json:"status"`
	CreatedAt      string          `json:"createdAt"`
}

type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AddSlotReq struct {
	At           string `json:"at"`
	Place        string `json:"place"`
	Photographer string `json:"photographer"`
}

type AddSelectionReq struct {
	Photos []string `json:"photos"`
	Note   string   `json:"note"`
}

type ConfirmSelectionReq struct {
	Version int  `json:"version"`
	Confirm bool `json:"confirm"`
}

type PayPaymentReq struct {
	Note string `json:"note"`
}

type CreateExceptionReq struct {
	Kind     string `json:"kind"`
	Severity string `json:"severity"`
	Summary  string `json:"summary"`
	Detail   string `json:"detail"`
}

type CloseExceptionReq struct {
	ClosedBy string `json:"closedBy"`
	Note     string `json:"note"`
}
