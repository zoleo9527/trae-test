-- Swimclub schema
-- PostgreSQL. Run in order.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    membership_end TIMESTAMPTZ NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    courses_total INT NOT NULL DEFAULT 0,
    courses_used INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    course_deduct INT NOT NULL DEFAULT 0,
    approver_id BIGINT REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    reject_reason TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_member  ON leave_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_leave_status  ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_created ON leave_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS renewal_reminders (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    expire_at TIMESTAMPTZ NOT NULL,
    channel TEXT NOT NULL DEFAULT 'sms',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_to BIGINT REFERENCES users(id),
    note TEXT,
    noticed_by BIGINT REFERENCES users(id),
    noticed_at TIMESTAMPTZ,
    closed_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renewal_member   ON renewal_reminders(member_id);
CREATE INDEX IF NOT EXISTS idx_renewal_status   ON renewal_reminders(status);
CREATE INDEX IF NOT EXISTS idx_renewal_assigned ON renewal_reminders(assigned_to);

CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    target TEXT NOT NULL,
    target_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_target ON notes(target, target_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    actor_id BIGINT NOT NULL,
    actor_name TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_ent ON audit_logs(entity_type, entity_id, at DESC);

CREATE TABLE IF NOT EXISTS notification_jobs (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL,
    target_id BIGINT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notification_jobs(status, next_run_at);
