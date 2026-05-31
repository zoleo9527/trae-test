CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    real_name VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('admin','project_manager','quality_engineer','team_leader')),
    phone VARCHAR(20),
    project_id UUID,
    team_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    location VARCHAR(256),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(128) NOT NULL,
    leader_name VARCHAR(64) NOT NULL,
    leader_phone VARCHAR(20),
    trade_type VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    record_date DATE NOT NULL,
    worker_name VARCHAR(64) NOT NULL,
    worker_id_card VARCHAR(18),
    status VARCHAR(16) NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','leave','late')),
    hours_worked NUMERIC(4,1) NOT NULL DEFAULT 0,
    work_area VARCHAR(128),
    task_description TEXT,
    remark TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE settlement_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','verified','approved','paid','disputed')),
    submitted_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE settlement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_batch_id UUID NOT NULL REFERENCES settlement_batches(id) ON DELETE CASCADE,
    attendance_record_id UUID REFERENCES attendance_records(id),
    worker_name VARCHAR(64) NOT NULL,
    record_date DATE NOT NULL,
    work_area VARCHAR(128),
    work_content TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(16) NOT NULL DEFAULT '工日',
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    daily_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    material_name VARCHAR(128) NOT NULL,
    specification VARCHAR(128),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(16) NOT NULL DEFAULT '吨',
    delivery_date DATE NOT NULL,
    received_by VARCHAR(64),
    receipt_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (receipt_status IN ('pending','received','rejected','partial')),
    remark TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    change_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    before_value JSONB,
    after_value JSONB,
    impact_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    requested_by UUID NOT NULL REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','cancelled')),
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    area VARCHAR(128) NOT NULL,
    inspection_date DATE NOT NULL,
    inspector_id UUID NOT NULL REFERENCES users(id),
    result VARCHAR(16) NOT NULL DEFAULT 'pass' CHECK (result IN ('pass','fail','rework')),
    issues_found TEXT,
    rework_required BOOLEAN NOT NULL DEFAULT FALSE,
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rework_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    quality_inspection_id UUID NOT NULL REFERENCES quality_inspections(id),
    reason TEXT NOT NULL,
    description TEXT,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    responsible_person VARCHAR(64) NOT NULL,
    settlement_batch_id UUID REFERENCES settlement_batches(id),
    completed_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','disputed')),
    remark TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(32) NOT NULL,
    before_value JSONB,
    after_value JSONB,
    operator_id UUID NOT NULL,
    operator_name VARCHAR(64) NOT NULL,
    operator_role VARCHAR(32) NOT NULL,
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_team_date ON attendance_records(team_id, record_date);
CREATE INDEX idx_attendance_project_date ON attendance_records(project_id, record_date);
CREATE INDEX idx_settlement_batch_team ON settlement_batches(team_id);
CREATE INDEX idx_settlement_batch_project ON settlement_batches(project_id);
CREATE INDEX idx_settlement_batch_status ON settlement_batches(status);
CREATE INDEX idx_settlement_item_batch ON settlement_items(settlement_batch_id);
CREATE INDEX idx_delivery_project ON delivery_receipts(project_id);
CREATE INDEX idx_delivery_team ON delivery_receipts(team_id);
CREATE INDEX idx_change_order_project ON change_orders(project_id);
CREATE INDEX idx_change_order_status ON change_orders(status);
CREATE INDEX idx_quality_project ON quality_inspections(project_id);
CREATE INDEX idx_quality_team ON quality_inspections(team_id);
CREATE INDEX idx_rework_project ON rework_records(project_id);
CREATE INDEX idx_rework_inspection ON rework_records(quality_inspection_id);
CREATE INDEX idx_audit_entity ON audit_trails(entity_type, entity_id);
CREATE INDEX idx_audit_operator ON audit_trails(operator_id);
CREATE INDEX idx_audit_created ON audit_trails(created_at);
