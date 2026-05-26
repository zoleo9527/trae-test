package notifier

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"
)

type Worker struct {
	DB *sql.DB
}

type job struct {
	ID       int64
	Kind     string
	TargetID int64
	Payload  string
	Attempts int
}

func New(db *sql.DB) *Worker { return &Worker{DB: db} }

func (w *Worker) Run(ctx context.Context) {
	t := time.NewTicker(5 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if err := w.process(ctx); err != nil {
				log.Printf("[notifier] process: %v", err)
			}
		}
	}
}

func (w *Worker) process(ctx context.Context) error {
	rows, err := w.DB.QueryContext(ctx,
		`SELECT id, kind, target_id, payload, attempts FROM notification_jobs
		 WHERE status='pending' AND next_run_at <= now() ORDER BY next_run_at ASC LIMIT 20`)
	if err != nil {
		return err
	}
	defer rows.Close()
	jobs := []job{}
	for rows.Next() {
		var j job
		if err := rows.Scan(&j.ID, &j.Kind, &j.TargetID, &j.Payload, &j.Attempts); err != nil {
			return err
		}
		jobs = append(jobs, j)
	}
	for _, j := range jobs {
		if err := w.handle(ctx, j); err != nil {
			_, _ = w.DB.ExecContext(ctx,
				`UPDATE notification_jobs SET attempts=attempts+1, last_error=$1, next_run_at=$2, updated_at=now() WHERE id=$3`,
				err.Error(), time.Now().Add(time.Duration(1<<uint(j.Attempts))*30*time.Second), j.ID)
			continue
		}
		_, _ = w.DB.ExecContext(ctx,
			`UPDATE notification_jobs SET status='done', updated_at=now() WHERE id=$1`, j.ID)
	}
	return nil
}

func (w *Worker) handle(ctx context.Context, j job) error {
	_ = ctx
	switch j.Kind {
	case "leave_created":
		log.Printf("[notifier] leave_created -> member=%d payload=%s", j.TargetID, j.Payload)
	case "leave_approved":
		log.Printf("[notifier] leave_approved -> payload=%s", j.Payload)
	case "renewal_created":
		log.Printf("[notifier] renewal_created -> payload=%s", j.Payload)
	default:
		return fmt.Errorf("unknown kind %s", j.Kind)
	}
	return nil
}
