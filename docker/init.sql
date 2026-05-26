-- 初始化数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'picker', 'accountant')),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客诉表
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    complaint_type VARCHAR(50) NOT NULL,
    description TEXT,
    weight_note_no VARCHAR(50),
    cold_storage_no VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rechecking', 'compensating', 'payment_pending', 'completed', 'rejected')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 复检表
CREATE TABLE rechecks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    recheck_person VARCHAR(100),
    cold_storage_location VARCHAR(100),
    recheck_time TIMESTAMP,
    grade_result VARCHAR(50),
    loss_ratio DECIMAL(5,2),
    loss_amount DECIMAL(12,2),
    remark TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 赔付表
CREATE TABLE compensations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    compensation_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    remark TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 回款表
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compensation_id UUID REFERENCES compensations(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    recorded_by UUID REFERENCES users(id),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 状态日志表
CREATE TABLE status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    remark TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 证据图片表
CREATE TABLE evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_rechecks_complaint_id ON rechecks(complaint_id);
CREATE INDEX idx_status_logs_complaint_id ON status_logs(complaint_id);
CREATE INDEX idx_evidences_complaint_id ON evidences(complaint_id);

-- 插入演示用户 (密码都是: 123456, bcrypt哈希)
INSERT INTO users (username, password_hash, role, name, phone) VALUES
('manager', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager', '张经理', '13800138001'),
('picker', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'picker', '李配货', '13800138002'),
('accountant', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'accountant', '王财务', '13800138003');

-- 插入演示客诉数据
WITH manager_id AS (SELECT id FROM users WHERE username = 'manager'),
     picker_id AS (SELECT id FROM users WHERE username = 'picker')
INSERT INTO complaints (customer_name, customer_phone, complaint_type, description, weight_note_no, cold_storage_no, status, created_by) VALUES
('王老板', '13900139001', '质量问题', '香蕉有黑斑，约5箱受影响', 'WB20240520001', 'A-01-05', 'pending', (SELECT id FROM manager_id)),
('李批发', '13900139002', '重量不足', '过磅单显示1000kg，实收只有950kg', 'WB20240520002', 'B-02-10', 'rechecking', (SELECT id FROM manager_id)),
('张零售', '13900139003', '配送错误', '订的是苹果，送来的是梨', 'WB20240520003', 'C-03-15', 'compensating', (SELECT id FROM manager_id)),
('刘超市', '13900139004', '质量问题', '西瓜有一半是熟过头的', 'WB20240520004', 'A-04-20', 'payment_pending', (SELECT id FROM manager_id)),
('陈果行', '13900139005', '包装损坏', '纸箱破损导致水果挤压', 'WB20240520005', 'D-01-08', 'completed', (SELECT id FROM manager_id)),
('周市场', '13900139006', '质量问题', '葡萄发霉，3箱全部退回', 'WB20240521001', 'A-02-12', 'pending', (SELECT id FROM manager_id)),
('吴配送', '13900139007', '延迟送达', '约定早上到，下午才送到', 'WB20240521002', 'B-03-05', 'rejected', (SELECT id FROM manager_id)),
('郑批发', '13900139008', '规格不符', '要的是大果，发来的是中果', 'WB20240521003', 'C-01-18', 'pending', (SELECT id FROM manager_id)),
('孙零售', '13900139009', '质量问题', '芒果有虫眼', 'WB20240521004', 'E-02-22', 'rechecking', (SELECT id FROM manager_id)),
('钱超市', '13900139010', '数量短缺', '订了50箱，只收到45箱', 'WB20240521005', 'F-01-03', 'compensating', (SELECT id FROM manager_id));

-- 插入演示复检数据
INSERT INTO rechecks (complaint_id, recheck_person, cold_storage_location, recheck_time, grade_result, loss_ratio, loss_amount, remark, operator_id)
SELECT c.id, '李配货', 'A区-1排-5号', NOW() - INTERVAL '2 hours', 'B级', 15.5, 1550.00, '确实存在黑斑，建议赔付客户15%', u.id
FROM complaints c, users u
WHERE c.weight_note_no = 'WB20240520002' AND u.username = 'picker';

INSERT INTO rechecks (complaint_id, recheck_person, cold_storage_location, recheck_time, grade_result, loss_ratio, loss_amount, remark, operator_id)
SELECT c.id, '李配货', 'C区-3排-15号', NOW() - INTERVAL '1 day', 'A级', 5.0, 500.00, '检查发现确实发错货，责任在我方', u.id
FROM complaints c, users u
WHERE c.weight_note_no = 'WB20240520003' AND u.username = 'picker';

INSERT INTO rechecks (complaint_id, recheck_person, cold_storage_location, recheck_time, grade_result, loss_ratio, loss_amount, remark, operator_id)
SELECT c.id, '李配货', 'A区-4排-20号', NOW() - INTERVAL '2 days', 'B级', 30.0, 3000.00, '西瓜成熟度过高，建议全额赔付', u.id
FROM complaints c, users u
WHERE c.weight_note_no = 'WB20240520004' AND u.username = 'picker';

INSERT INTO rechecks (complaint_id, recheck_person, cold_storage_location, recheck_time, grade_result, loss_ratio, loss_amount, remark, operator_id)
SELECT c.id, '李配货', 'D区-1排-8号', NOW() - INTERVAL '3 days', 'A级', 2.0, 200.00, '包装轻微破损，不影响货品', u.id
FROM complaints c, users u
WHERE c.weight_note_no = 'WB20240520005' AND u.username = 'picker';

-- 插入演示赔付数据
INSERT INTO compensations (complaint_id, amount, compensation_method, status, approved_by, remark, approved_at)
SELECT c.id, 3000.00, '退款', 'approved', u.id, '同意全额赔付', NOW() - INTERVAL '1 day'
FROM complaints c, users u
WHERE c.weight_note_no = 'WB20240520004' AND u.username = 'manager';

INSERT INTO compensations (complaint_id, amount, compensation_method, status, approved_by, remark, approved_at)
SELECT c.id, 200.00, '抵扣下次货款', 'approved', u.id, '同意赔付包装损失费', NOW() - INTERVAL '2 days'
FROM complaints c, users u
WHERE c.weight_note_no = 'WB20240520005' AND u.username = 'manager';

-- 插入演示回款数据
INSERT INTO payments (compensation_id, amount, payment_date, payment_method, recorded_by, remark)
SELECT comp.id, 200.00, NOW() - INTERVAL '1 day', '账扣', u.id, '已在5月21日货款中抵扣'
FROM compensations comp, complaints c, users u
WHERE comp.complaint_id = c.id AND c.weight_note_no = 'WB20240520005' AND u.username = 'accountant';

-- 插入演示状态日志
INSERT INTO status_logs (complaint_id, from_status, to_status, remark, operator_id)
SELECT c.id, NULL, 'pending', '客诉已登记', u.id
FROM complaints c, users u WHERE c.status = 'pending' AND u.username = 'manager' LIMIT 3;

INSERT INTO status_logs (complaint_id, from_status, to_status, remark, operator_id)
SELECT c.id, 'pending', 'rechecking', '已安排复检', u.id
FROM complaints c, users u WHERE c.status = 'rechecking' AND u.username = 'manager';

INSERT INTO status_logs (complaint_id, from_status, to_status, remark, operator_id)
SELECT c.id, 'rechecking', 'compensating', '复检完成，进入赔付审批', u.id
FROM complaints c, users u WHERE c.status = 'compensating' AND u.username = 'picker';

INSERT INTO status_logs (complaint_id, from_status, to_status, remark, operator_id)
SELECT c.id, 'compensating', 'payment_pending', '赔付已批准，等待回款', u.id
FROM complaints c, users u WHERE c.weight_note_no = 'WB20240520004' AND u.username = 'manager';

INSERT INTO status_logs (complaint_id, from_status, to_status, remark, operator_id)
SELECT c.id, 'payment_pending', 'completed', '回款完成，案件结案', u.id
FROM complaints c, users u WHERE c.weight_note_no = 'WB20240520005' AND u.username = 'accountant';
