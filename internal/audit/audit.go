package audit

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type Logger struct {
	db *sql.DB
}

func New(db *sql.DB) *Logger { return &Logger{db: db} }

func (l *Logger) Record(ctx context.Context, entityType string, entityID int64, action string, oldV, newV map[string]any, actorID int64, actorName string) error {
	ob, _ := json.Marshal(oldV)
	nb, _ := json.Marshal(newV)
	_, err := l.db.ExecContext(ctx, `
		INSERT INTO audit_logs(entity_type, entity_id, action, old_value, new_value, actor_id, actor_name, at)
		VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8)`,
		entityType, entityID, action, string(ob), string(nb), actorID, actorName, time.Now().UTC())
	return err
}

func (l *Logger) List(ctx context.Context, entityType string, entityID int64, limit, offset int) ([]map[string]any, error) {
	q := `SELECT id, entity_type, entity_id, action, old_value, new_value, actor_id, actor_name, at FROM audit_logs WHERE 1=1`
	args := []any{}
	i := 1
	if entityType != "" {
		q += fmt.Sprintf(" AND entity_type = $%d", i)
		args = append(args, entityType)
		i++
	}
	if entityID != 0 {
		q += fmt.Sprintf(" AND entity_id = $%d", i)
		args = append(args, entityID)
		i++
	}
	q += " ORDER BY at DESC"
	if limit <= 0 {
		limit = 50
	}
	q += fmt.Sprintf(" LIMIT $%d", i)
	args = append(args, limit)
	i++
	if offset > 0 {
		q += fmt.Sprintf(" OFFSET $%d", i)
		args = append(args, offset)
	}
	rows, err := l.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var (
			id, entID, actorID              int64
			entType, action, actorName      string
			oldB, newB                      []byte
			at                              time.Time
		)
		if err := rows.Scan(&id, &entType, &entID, &action, &oldB, &newB, &actorID, &actorName, &at); err != nil {
			return nil, err
		}
		var ov, nv map[string]any
		_ = json.Unmarshal(oldB, &ov)
		_ = json.Unmarshal(newB, &nv)
		out = append(out, map[string]any{
			"id": id, "entity_type": entType, "entity_id": entID, "action": action,
			"old_value": ov, "new_value": nv, "actor_id": actorID, "actor_name": actorName, "at": at,
		})
	}
	return out, nil
}
