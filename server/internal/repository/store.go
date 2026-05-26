package repository

import (
	"sync"
	"time"
	"weddingsys/internal"
)

type Store struct {
	mu       sync.RWMutex
	users    []internal.User
	orders   []internal.Order
	sessions map[string]string
}

func New() *Store {
	s := &Store{sessions: map[string]string{}}
	s.seed()
	return s
}

func (s *Store) seed() {
	s.users = []internal.User{
		{ID: "u1", Username: "manager", Password: "123456", Name: "林店长", Role: internal.RoleManager},
		{ID: "u2", Username: "editor", Password: "123456", Name: "陈选片", Role: internal.RoleEditor},
		{ID: "u3", Username: "service", Password: "123456", Name: "王管家", Role: internal.RoleService},
	}
	now := time.Now()
	o1 := internal.Order{
		ID: "o1", No: "W20260518001", CustomerName: "周雪 & 刘明", CustomerPhone: "13812340001",
		Package: "经典套餐 · 5服5造", ManagerID: "u1", ManagerName: "林店长",
		EditorID: "u2", EditorName: "陈选片", ServiceID: "u3", ServiceName: "王管家",
		Status: "拍摄中", CreatedAt: now.Add(-9 * 24 * time.Hour).Format(time.RFC3339),
		Slots: []internal.PhotoSlot{
			{ID: "s1", At: now.Add(2 * 24 * time.Hour).Format(time.RFC3339), Place: "摄影基地A馆", Photographer: "阿Ken"},
		},
		Selections: []internal.Selection{},
		Payments: []internal.Payment{
			{ID: "p1", Stage: "定金", Amount: 3000, Paid: true, DueAt: now.Add(-9 * 24 * time.Hour).Format(time.RFC3339), PaidAt: now.Add(-9 * 24 * time.Hour).Format(time.RFC3339), Note: "微信支付"},
			{ID: "p2", Stage: "尾款", Amount: 6800, Paid: false, DueAt: now.Add(10 * 24 * time.Hour).Format(time.RFC3339), Note: ""},
		},
		Exceptions: []internal.ExceptionItem{},
		Timeline: []internal.TimelineEvent{
			{ID: "t1", At: now.Add(-9 * 24 * time.Hour).Format(time.RFC3339), Stage: "档期", Actor: "林店长", Action: "创建订单", Detail: "拍摄档期 2026-05-28 A馆"},
		},
	}
	o2 := internal.Order{
		ID: "o2", No: "W20260420008", CustomerName: "吴琳 & 赵伟", CustomerPhone: "13812340002",
		Package: "轻旅拍 · 3服3造", ManagerID: "u1", ManagerName: "林店长",
		EditorID: "u2", EditorName: "陈选片", ServiceID: "u3", ServiceName: "王管家",
		Status: "选片中", CreatedAt: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339),
		Slots: []internal.PhotoSlot{
			{ID: "s1", At: now.Add(-25 * 24 * time.Hour).Format(time.RFC3339), Place: "西湖外景", Photographer: "阿Ken"},
		},
		Selections: []internal.Selection{
			{ID: "sel1", Version: 1, CreatedAt: now.Add(-20 * 24 * time.Hour).Format(time.RFC3339), Photos: []string{"IMG_0101", "IMG_0108", "IMG_0112"}, EditorID: "u2", EditorName: "陈选片", Confirmed: false, Note: "初修 45 张"},
			{ID: "sel2", Version: 2, CreatedAt: now.Add(-10 * 24 * time.Hour).Format(time.RFC3339), Photos: []string{"IMG_0101", "IMG_0112", "IMG_0205"}, EditorID: "u2", EditorName: "陈选片", Confirmed: false, Note: "按客户意见二次修片"},
		},
		Payments: []internal.Payment{
			{ID: "p1", Stage: "定金", Amount: 2000, Paid: true, DueAt: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339), PaidAt: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339), Note: "到店刷卡"},
			{ID: "p2", Stage: "尾款", Amount: 5800, Paid: false, DueAt: now.Add(-2 * 24 * time.Hour).Format(time.RFC3339), Note: ""},
		},
		Exceptions: []internal.ExceptionItem{
			{ID: "e1", OrderID: "o2", Kind: "改期漏改", Severity: "高", Status: "处理中", Summary: "客户微信改到 5/10，但系统仍为 5/5", Detail: "客户 5/3 在微信上要求改到 5/10，客服口头答应但未更新档期表，导致摄影师按原档期到场空跑。", CreatedAt: now.Add(-1*24*time.Hour - 3*time.Hour).Format(time.RFC3339)},
		},
		Timeline: []internal.TimelineEvent{
			{ID: "t1", At: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339), Stage: "档期", Actor: "林店长", Action: "创建订单", Detail: "拍摄档期 2026-05-01 西湖外景"},
			{ID: "t2", At: now.Add(-20 * 24 * time.Hour).Format(time.RFC3339), Stage: "选片", Actor: "陈选片", Action: "上传初修", Detail: "版本 v1 共 45 张"},
			{ID: "t3", At: now.Add(-10 * 24 * time.Hour).Format(time.RFC3339), Stage: "选片", Actor: "陈选片", Action: "上传二次修", Detail: "版本 v2 替换部分照片"},
			{ID: "t4", At: now.Add(-1*24*time.Hour - 3*time.Hour).Format(time.RFC3339), Stage: "异常", Actor: "王管家", Action: "发起异常", Detail: "改期漏改，摄影师空跑"},
		},
	}
	o3 := internal.Order{
		ID: "o3", No: "W20260312003", CustomerName: "高颖 & 孙浩", CustomerPhone: "13812340003",
		Package: "尊享套餐 · 6服6造", ManagerID: "u1", ManagerName: "林店长",
		EditorID: "u2", EditorName: "陈选片", ServiceID: "u3", ServiceName: "王管家",
		Status: "客诉中", CreatedAt: now.Add(-70 * 24 * time.Hour).Format(time.RFC3339),
		Slots: []internal.PhotoSlot{
			{ID: "s1", At: now.Add(-65 * 24 * time.Hour).Format(time.RFC3339), Place: "摄影基地B馆", Photographer: "小林"},
			{ID: "s2", At: now.Add(-60 * 24 * time.Hour).Format(time.RFC3339), Place: "园林外景", Photographer: "小林"},
		},
		Selections: []internal.Selection{
			{ID: "sel1", Version: 1, CreatedAt: now.Add(-55 * 24 * time.Hour).Format(time.RFC3339), Photos: []string{"IMG_1001", "IMG_1010", "IMG_1020"}, EditorID: "u2", EditorName: "陈选片", Confirmed: true, Note: "初修 80 张"},
			{ID: "sel2", Version: 2, CreatedAt: now.Add(-40 * 24 * time.Hour).Format(time.RFC3339), Photos: []string{"IMG_1001", "IMG_1020", "IMG_2001"}, EditorID: "u2", EditorName: "陈选片", Confirmed: true, Note: "客户确认后精修"},
			{ID: "sel3", Version: 3, CreatedAt: now.Add(-15 * 24 * time.Hour).Format(time.RFC3339), Photos: []string{"IMG_1001", "IMG_2001", "IMG_3005"}, EditorID: "u2", EditorName: "陈选片", Confirmed: false, Note: "再次替换导致客户不满"},
		},
		Payments: []internal.Payment{
			{ID: "p1", Stage: "定金", Amount: 5000, Paid: true, DueAt: now.Add(-70 * 24 * time.Hour).Format(time.RFC3339), PaidAt: now.Add(-70 * 24 * time.Hour).Format(time.RFC3339), Note: ""},
			{ID: "p2", Stage: "尾款", Amount: 12000, Paid: false, DueAt: now.Add(-5*24*time.Hour).Format(time.RFC3339), Note: "客户要求先解决修片问题再付"},
		},
		Exceptions: []internal.ExceptionItem{
			{ID: "e1", OrderID: "o3", Kind: "修片版本混乱", Severity: "高", Status: "处理中", Summary: "v3 替换了 v2 已确认的照片", Detail: "选片师在 v2 已确认后又上传 v3 替换了多张照片，客户在群里质问为何确认过的照片被换掉，已产生客诉。", CreatedAt: now.Add(-12*24*time.Hour - 5*time.Hour).Format(time.RFC3339)},
			{ID: "e2", OrderID: "o3", Kind: "尾款催收", Severity: "中", Status: "待处理", Summary: "尾款逾期 5 日未付", Detail: "尾款 12000 元应于 5 日前支付，客户表示需先解决修片问题。", CreatedAt: now.Add(-5*24*time.Hour - 2*time.Hour).Format(time.RFC3339)},
		},
		Timeline: []internal.TimelineEvent{
			{ID: "t1", At: now.Add(-70 * 24 * time.Hour).Format(time.RFC3339), Stage: "档期", Actor: "林店长", Action: "创建订单", Detail: "两次拍摄"},
			{ID: "t2", At: now.Add(-55 * 24 * time.Hour).Format(time.RFC3339), Stage: "选片", Actor: "陈选片", Action: "上传 v1", Detail: "初修"},
			{ID: "t3", At: now.Add(-40 * 24 * time.Hour).Format(time.RFC3339), Stage: "选片", Actor: "陈选片", Action: "上传 v2", Detail: "客户确认精修"},
			{ID: "t4", At: now.Add(-15 * 24 * time.Hour).Format(time.RFC3339), Stage: "选片", Actor: "陈选片", Action: "上传 v3", Detail: "替换已确认照片"},
			{ID: "t5", At: now.Add(-12*24*time.Hour - 5*time.Hour).Format(time.RFC3339), Stage: "异常", Actor: "王管家", Action: "发起异常", Detail: "客户群内质问"},
			{ID: "t6", At: now.Add(-5*24*time.Hour - 2*time.Hour).Format(time.RFC3339), Stage: "异常", Actor: "王管家", Action: "发起异常", Detail: "尾款逾期"},
		},
	}
	o4 := internal.Order{
		ID: "o4", No: "W20260520007", CustomerName: "苏妍 & 李默", CustomerPhone: "13812340004",
		Package: "轻旅拍 · 3服3造", ManagerID: "u1", ManagerName: "林店长",
		EditorID: "u2", EditorName: "陈选片", ServiceID: "u3", ServiceName: "王管家",
		Status: "已完成", CreatedAt: now.Add(-60 * 24 * time.Hour).Format(time.RFC3339),
		Slots: []internal.PhotoSlot{
			{ID: "s1", At: now.Add(-55 * 24 * time.Hour).Format(time.RFC3339), Place: "摄影基地A馆", Photographer: "阿Ken"},
		},
		Selections: []internal.Selection{
			{ID: "sel1", Version: 1, CreatedAt: now.Add(-45 * 24 * time.Hour).Format(time.RFC3339), Photos: []string{"IMG_5001", "IMG_5010"}, EditorID: "u2", EditorName: "陈选片", Confirmed: true, Note: "客户确认"},
		},
		Payments: []internal.Payment{
			{ID: "p1", Stage: "定金", Amount: 2000, Paid: true, DueAt: now.Add(-60 * 24 * time.Hour).Format(time.RFC3339), PaidAt: now.Add(-60 * 24 * time.Hour).Format(time.RFC3339), Note: ""},
			{ID: "p2", Stage: "尾款", Amount: 4800, Paid: true, DueAt: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339), PaidAt: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339), Note: "微信支付"},
		},
		Exceptions: []internal.ExceptionItem{},
		Timeline: []internal.TimelineEvent{
			{ID: "t1", At: now.Add(-60 * 24 * time.Hour).Format(time.RFC3339), Stage: "档期", Actor: "林店长", Action: "创建订单", Detail: ""},
			{ID: "t2", At: now.Add(-45 * 24 * time.Hour).Format(time.RFC3339), Stage: "选片", Actor: "陈选片", Action: "上传 v1", Detail: "客户确认"},
			{ID: "t3", At: now.Add(-30 * 24 * time.Hour).Format(time.RFC3339), Stage: "尾款", Actor: "王管家", Action: "尾款到账", Detail: "4800 元"},
		},
	}
	s.orders = []internal.Order{o1, o2, o3, o4}
}

func (s *Store) Users() []internal.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]internal.User, len(s.users))
	copy(out, s.users)
	return out
}

func (s *Store) FindUser(username, password string) *internal.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if u.Username == username && u.Password == password {
			u2 := u
			return &u2
		}
	}
	return nil
}

func (s *Store) FindUserByID(id string) *internal.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if u.ID == id {
			u2 := u
			return &u2
		}
	}
	return nil
}

func (s *Store) AddSession(token, userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[token] = userID
}

func (s *Store) SessionUser(token string) *internal.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	uid, ok := s.sessions[token]
	if !ok {
		return nil
	}
	return s.FindUserByID(uid)
}

func (s *Store) Orders() []internal.Order {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]internal.Order, len(s.orders))
	copy(out, s.orders)
	return out
}

func (s *Store) FindOrder(id string) *internal.Order {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i, o := range s.orders {
		if o.ID == id {
			return &s.orders[i]
		}
	}
	return nil
}

func (s *Store) UpdateOrder(id string, fn func(*internal.Order)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, o := range s.orders {
		if o.ID == id {
			fn(&s.orders[i])
			return
		}
	}
}
