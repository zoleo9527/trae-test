package seed

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func Run(ctx context.Context, db *sql.DB) error {
	var c int
	db.QueryRowContext(ctx, `SELECT count(*) FROM users`).Scan(&c)
	if c > 0 {
		return nil
	}
	hash := func(pw string) string {
		b, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(b)
	}
	users := []struct{ u, r, n, p string }{
		{"owner", "owner", "馆长 陈馆长", "123456"},
		{"coach", "coach_head", "教练主管 李教练", "123456"},
		{"front", "front_desk", "前台 王前台", "123456"},
	}
	for _, u := range users {
		_, err := db.ExecContext(ctx,
			`INSERT INTO users(username,password_hash,role,display_name) VALUES($1,$2,$3,$4)`,
			u.u, hash(u.p), u.r, u.n)
		if err != nil {
			return err
		}
	}
	var ownerID, coachID, frontID int64
	db.QueryRowContext(ctx, `SELECT id FROM users WHERE username='owner'`).Scan(&ownerID)
	db.QueryRowContext(ctx, `SELECT id FROM users WHERE username='coach'`).Scan(&coachID)
	db.QueryRowContext(ctx, `SELECT id FROM users WHERE username='front'`).Scan(&frontID)

	members := []struct{ n, ph string; end time.Time; bal, total, used int }{
		{"张小鱼", "13800000001", time.Now().Add(40 * 24 * time.Hour), 1200, 24, 10},
		{"刘水花", "13800000002", time.Now().Add(10 * 24 * time.Hour), 300, 12, 8},
		{"王海豚", "13800000003", time.Now().Add(80 * 24 * time.Hour), 2000, 36, 20},
		{"赵蛙人", "13800000004", time.Now().Add(3 * 24 * time.Hour), 50, 10, 10},
	}
	for _, m := range members {
		_, err := db.ExecContext(ctx,
			`INSERT INTO members(name,phone,membership_end,balance,courses_total,courses_used) VALUES($1,$2,$3,$4,$5,$6)`,
			m.n, m.ph, m.end, m.bal, m.total, m.used)
		if err != nil {
			return err
		}
	}

	var m1, m2, m3, m4 int64
	db.QueryRowContext(ctx, `SELECT id FROM members WHERE phone='13800000001'`).Scan(&m1)
	db.QueryRowContext(ctx, `SELECT id FROM members WHERE phone='13800000002'`).Scan(&m2)
	db.QueryRowContext(ctx, `SELECT id FROM members WHERE phone='13800000003'`).Scan(&m3)
	db.QueryRowContext(ctx, `SELECT id FROM members WHERE phone='13800000004'`).Scan(&m4)

	leaves := []struct {
		mid      int64
		start    time.Time
		end      time.Time
		reason   string
		status   string
		deduct   int
		approver *int64
		by       int64
	}{
		{m1, time.Now().Add(-30 * 24 * time.Hour), time.Now().Add(-23 * 24 * time.Hour), "出国旅游", "approved", 2, &coachID, frontID},
		{m1, time.Now().Add(-3 * 24 * time.Hour), time.Now().Add(4 * 24 * time.Hour), "感冒发烧", "pending", 1, nil, frontID},
		{m2, time.Now().Add(-5 * 24 * time.Hour), time.Now().Add(-2 * 24 * time.Hour), "生理期", "rejected", 0, &coachID, frontID},
	}
	for _, lv := range leaves {
		var id int64
		row := db.QueryRowContext(ctx,
			`INSERT INTO leave_requests(member_id,start_date,end_date,reason,status,course_deduct,created_by,approver_id,approved_at,reject_reason,created_at,updated_at)
			 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
			lv.mid, lv.start, lv.end, lv.reason, lv.status, lv.deduct, lv.by, lv.approver,
			nullableTime(lv.status == "approved"), nullableStr(lv.status == "rejected", "需在课表登记缺席,暂不批假"),
			lv.start, lv.start)
		if err := row.Scan(&id); err != nil {
			return err
		}
		_, _ = db.ExecContext(ctx,
			`INSERT INTO audit_logs(entity_type,entity_id,action,old_value,new_value,actor_id,actor_name,at)
			 VALUES('leave_request',$1,'create',NULL,$2::jsonb,$3,$4,$5)`,
			id, fmt.Sprintf(`{"reason":%q,"member_id":%d}`, lv.reason, lv.mid), lv.by, displayOf(lv.by, ownerID, coachID, frontID), lv.start)

		if lv.status == "approved" {
			oldV := fmt.Sprintf(`{"status":"pending","course_deduct":%d,"approver_id":null,"approved_at":null}`, lv.deduct)
			newV := fmt.Sprintf(`{"status":"approved","course_deduct":%d,"approver_id":%d,"approved_at":%q,"member_courses_used_old":8,"member_courses_used_add":%d,"member_courses_used_new":%d}`,
				lv.deduct, *lv.approver, lv.start.Add(24*time.Hour).Format(time.RFC3339), lv.deduct, 8+lv.deduct)
			_, _ = db.ExecContext(ctx,
				`INSERT INTO audit_logs(entity_type,entity_id,action,old_value,new_value,actor_id,actor_name,at)
				 VALUES('leave_request',$1,'approve',$2::jsonb,$3::jsonb,$4,$5,$6)`,
				id, oldV, newV, *lv.approver, displayOf(*lv.approver, ownerID, coachID, frontID), lv.start.Add(24*time.Hour))
		}
		if lv.status == "rejected" {
			oldV := fmt.Sprintf(`{"status":"pending","course_deduct":%d,"reject_reason":null}`, lv.deduct)
			newV := fmt.Sprintf(`{"status":"rejected","course_deduct":%d,"reject_reason":"需在课表登记缺席,暂不批假"}`, lv.deduct)
			_, _ = db.ExecContext(ctx,
				`INSERT INTO audit_logs(entity_type,entity_id,action,old_value,new_value,actor_id,actor_name,at)
				 VALUES('leave_request',$1,'reject',$2::jsonb,$3::jsonb,$4,$5,$6)`,
				id, oldV, newV, *lv.approver, displayOf(*lv.approver, ownerID, coachID, frontID), lv.start.Add(24*time.Hour))
		}
	}

	renewals := []struct {
		mid    int64
		exp    time.Time
		ch     string
		st     string
		assign *int64
		note   *string
	}{
		{m1, time.Now().Add(40 * 24 * time.Hour), "sms", "open", &coachID, nil},
		{m2, time.Now().Add(10 * 24 * time.Hour), "wechat", "noticed", &frontID, ptr("客户回复说月底充值")},
		{m4, time.Now().Add(3 * 24 * time.Hour), "phone", "open", &coachID, nil},
	}
	for _, r := range renewals {
		var id int64
		var noticedBy *int64
		if r.st == "noticed" && r.assign != nil {
			v := *r.assign
			noticedBy = &v
		}
		row := db.QueryRowContext(ctx,
			`INSERT INTO renewal_reminders(member_id,expire_at,channel,status,assigned_to,note,noticed_by,noticed_at,created_at,updated_at)
			 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
			r.mid, r.exp, r.ch, r.st, r.assign, r.note,
			noticedBy, nullableTime(r.st == "noticed"),
			time.Now().Add(-2*time.Hour), time.Now())
		if err := row.Scan(&id); err != nil {
			return err
		}

		_, _ = db.ExecContext(ctx,
			`INSERT INTO audit_logs(entity_type,entity_id,action,old_value,new_value,actor_id,actor_name,at)
			 VALUES('renewal',$1,'create',NULL,$2::jsonb,$3,$4,$5)`,
			id, fmt.Sprintf(`{"member_id":%d,"expire_at":%q,"channel":%q,"status":"open"}`,
				r.mid, r.exp.Format(time.RFC3339), r.ch),
			frontID, "前台 王前台", time.Now().Add(-2*time.Hour))

		if r.st == "noticed" && r.assign != nil && r.note != nil {
			oldV := `{"status":"open","assigned_to":null,"note":null,"noticed_by":null,"noticed_at":null}`
			newV := fmt.Sprintf(`{"status":"noticed","assigned_to":%d,"note":%q,"noticed_by":%d,"noticed_at":%q}`,
				*r.assign, *r.note, *r.assign, time.Now().Add(-1*time.Hour).Format(time.RFC3339))
			_, _ = db.ExecContext(ctx,
				`INSERT INTO audit_logs(entity_type,entity_id,action,old_value,new_value,actor_id,actor_name,at)
				 VALUES('renewal',$1,'update',$2::jsonb,$3::jsonb,$4,$5,$6)`,
				id, oldV, newV, *r.assign, displayOf(*r.assign, ownerID, coachID, frontID),
				time.Now().Add(-1*time.Hour))
		}
	}

	notes := []struct {
		target string
		tid    int64
		author int64
		body   string
	}{
		{"leave_request", 2, frontID, "前台登记请假,已同步到教练主管待处理"},
		{"leave_request", 3, coachID, "驳回: 请假期间该会员需补一次私教课"},
		{"member", m2, frontID, "客户上次投诉水质浑浊,本周已安排换水"},
		{"renewal", 2, frontID, "短信已发,电话未接通,改走微信"},
		{"member", m4, ownerID, "长期低余额,建议店长跟进谈年卡"},
	}
	for _, n := range notes {
		_, err := db.ExecContext(ctx,
			`INSERT INTO notes(target,target_id,author_id,content) VALUES($1,$2,$3,$4)`,
			n.target, n.tid, n.author, n.body)
		if err != nil {
			return err
		}
	}

	for _, m := range []int64{m1, m2, m3, m4} {
		_, _ = db.ExecContext(ctx,
			`INSERT INTO audit_logs(entity_type,entity_id,action,old_value,new_value,actor_id,actor_name,at)
			 VALUES('member',$1,'create',NULL,$2::jsonb,$3,$4,$5)`,
			m, `{"status":"active"}`, frontID, "前台 王前台", time.Now().Add(-90*24*time.Hour))
	}
	return nil
}

func displayOf(id, owner, coach, front int64) string {
	switch id {
	case owner:
		return "馆长 陈馆长"
	case coach:
		return "教练主管 李教练"
	case front:
		return "前台 王前台"
	}
	return "系统"
}

func ptr(s string) *string        { return &s }
func nullableTime(ok bool) *time.Time {
	if !ok {
		return nil
	}
	t := time.Now().UTC()
	return &t
}
func nullableInt(ok bool, v int64) *int64 {
	if !ok {
		return nil
	}
	return &v
}
func nullableStr(ok bool, s string) *string {
	if !ok {
		return nil
	}
	return &s
}
