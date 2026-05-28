const bcrypt = require('bcryptjs');
const db = require('./database');

function initSampleData() {
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err || result.count > 0) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }

    console.log('Creating sample data...');

    const users = [
      { username: 'manager', password: '123456', name: '张经理', role: 'agent_manager', email: 'zhang@shipagent.com', phone: '13800138001' },
      { username: 'field', password: '123456', name: '李协调', role: 'field_coordinator', email: 'li@shipagent.com', phone: '13800138002' },
      { username: 'doc', password: '123456', name: '王单证', role: 'document_specialist', email: 'wang@shipagent.com', phone: '13800138003' },
    ];

    users.forEach((user, index) => {
      bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) return;
        db.run(
          'INSERT INTO users (username, password, name, role, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
          [user.username, hash, user.name, user.role, user.email, user.phone]
        );
      });
    });

    const ships = [
      { name: '中远之星', imo: 'IMO9781234', flag: '中国', type: '集装箱船', gross_tonnage: 50000, owner: '中远海运' },
      { name: '海洋量子号', imo: 'IMO9876543', flag: '巴拿马', type: '散货船', gross_tonnage: 35000, owner: '海洋运输' },
      { name: '东方明珠', imo: 'IMO9654321', flag: '香港', type: '油轮', gross_tonnage: 80000, owner: '东方航运' },
      { name: '太平洋号', imo: 'IMO9543210', flag: '新加坡', type: '集装箱船', gross_tonnage: 65000, owner: '太平洋航运' },
    ];

    ships.forEach(ship => {
      db.run(
        'INSERT INTO ships (name, imo, flag, type, gross_tonnage, owner) VALUES (?, ?, ?, ?, ?, ?)',
        [ship.name, ship.imo, ship.flag, ship.type, ship.gross_tonnage, ship.owner]
      );
    });

    const berthPlans = [
      { ship_id: 1, ship_name: '中远之星', arrival_date: '2026-05-29 08:00:00', departure_date: '2026-05-30 16:00:00', berth_number: 'B-01', status: 'confirmed', purpose: '集装箱装卸', agent_id: 1 },
      { ship_id: 2, ship_name: '海洋量子号', arrival_date: '2026-05-30 14:00:00', departure_date: '2026-06-01 10:00:00', berth_number: 'A-03', status: 'pending', purpose: '散货装卸+船员换班', agent_id: 1 },
      { ship_id: 3, ship_name: '东方明珠', arrival_date: '2026-06-02 06:00:00', departure_date: '2026-06-03 20:00:00', berth_number: 'C-02', status: 'confirmed', purpose: '燃油补给+补给', agent_id: 1 },
      { ship_id: 4, ship_name: '太平洋号', arrival_date: '2026-06-05 12:00:00', departure_date: null, berth_number: null, status: 'draft', purpose: '待确认', agent_id: null },
    ];

    berthPlans.forEach(plan => {
      db.run(
        'INSERT INTO berth_plans (ship_id, ship_name, arrival_date, departure_date, berth_number, status, purpose, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [plan.ship_id, plan.ship_name, plan.arrival_date, plan.departure_date, plan.berth_number, plan.status, plan.purpose, plan.agent_id]
      );
    });

    const services = [
      { berth_plan_id: 1, type: 'crew_change', title: '船员换班', description: '上船3人，下船2人', status: 'completed', requested_by: 2 },
      { berth_plan_id: 1, type: 'supply', title: '食品补给', description: '蔬菜、肉类、饮用水', status: 'completed', requested_by: 2 },
      { berth_plan_id: 2, type: 'crew_change', title: '船员换班', description: '大换班，上船8人，下船7人', status: 'in_progress', requested_by: 2 },
      { berth_plan_id: 2, type: 'supply', title: '物料补给', description: '润滑油、清洁用品', status: 'pending', requested_by: 2 },
      { berth_plan_id: 3, type: 'supply', title: '燃油补给', description: '重油500吨，轻油100吨', status: 'pending', requested_by: 2 },
    ];

    services.forEach(service => {
      db.run(
        'INSERT INTO services (berth_plan_id, type, title, description, status, requested_by, requested_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [service.berth_plan_id, service.type, service.title, service.description, service.status, service.requested_by, '2026-05-20 10:00:00']
      );
    });

    const crewChanges = [
      { berth_plan_id: 1, service_id: 1, type: 'sign_on', crew_name: '陈船长', rank: '船长', nationality: '中国', status: 'completed', documents_status: 'approved' },
      { berth_plan_id: 1, service_id: 1, type: 'sign_on', crew_name: '刘大副', rank: '大副', nationality: '中国', status: 'completed', documents_status: 'approved' },
      { berth_plan_id: 1, service_id: 1, type: 'sign_off', crew_name: '王轮机长', rank: '轮机长', nationality: '中国', status: 'completed', documents_status: 'approved' },
      { berth_plan_id: 2, service_id: 3, type: 'sign_on', crew_name: '赵三副', rank: '三副', nationality: '菲律宾', status: 'pending', documents_status: 'pending', visa_expiry: '2026-06-15', arrival_flight: 'MU501' },
      { berth_plan_id: 2, service_id: 3, type: 'sign_on', crew_name: '孙水手', rank: '水手', nationality: '缅甸', status: 'pending', documents_status: 'rejected', visa_expiry: '2026-05-28', arrival_flight: 'CA123' },
    ];

    crewChanges.forEach(crew => {
      db.run(
        'INSERT INTO crew_changes (berth_plan_id, service_id, type, crew_name, rank, nationality, status, documents_status, visa_expiry, arrival_flight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [crew.berth_plan_id, crew.service_id, crew.type, crew.crew_name, crew.rank, crew.nationality, crew.status, crew.documents_status, crew.visa_expiry, crew.arrival_flight]
      );
    });

    const supplies = [
      { berth_plan_id: 1, service_id: 2, category: 'food', items: '["蔬菜100kg","猪肉50kg","饮用水200L"]', estimated_cost: 8500, status: 'completed', delivery_date: '2026-05-29' },
      { berth_plan_id: 2, service_id: 4, category: 'material', items: '["润滑油50桶","清洁剂20箱"]', estimated_cost: 25000, status: 'pending', delivery_date: '2026-05-31' },
      { berth_plan_id: 3, service_id: 5, category: 'fuel', items: '["重油500吨","轻油100吨"]', estimated_cost: 2800000, status: 'pending', delivery_date: '2026-06-02' },
    ];

    supplies.forEach(supply => {
      db.run(
        'INSERT INTO supplies (berth_plan_id, service_id, category, items, estimated_cost, status, delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [supply.berth_plan_id, supply.service_id, supply.category, supply.items, supply.estimated_cost, supply.status, supply.delivery_date]
      );
    });

    const payments = [
      { berth_plan_id: 1, service_id: 2, invoice_number: 'INV-2026-0001', supplier: '上海食品供应有限公司', amount: 8500, currency: 'CNY', description: '中远之星食品补给', paid_date: '2026-05-28', due_date: '2026-06-28', status: 'paid', paid_by: 1 },
      { berth_plan_id: 2, service_id: 3, invoice_number: 'INV-2026-0002', supplier: '国际船员服务公司', amount: 35000, currency: 'CNY', description: '海洋量子号船员换班代理费', due_date: '2026-06-15', status: 'pending', paid_by: 1 },
      { berth_plan_id: 2, service_id: 4, invoice_number: 'INV-2026-0003', supplier: '船舶物料供应公司', amount: 25000, currency: 'CNY', description: '海洋量子号物料供应', due_date: '2026-05-25', status: 'overdue', paid_by: 1 },
      { berth_plan_id: 3, service_id: 5, invoice_number: 'INV-2026-0004', supplier: '中国石化燃料油公司', amount: 2800000, currency: 'CNY', description: '东方明珠燃油补给', due_date: '2026-06-10', status: 'pending', paid_by: 1 },
    ];

    payments.forEach(payment => {
      db.run(
        'INSERT INTO advance_payments (berth_plan_id, service_id, invoice_number, supplier, amount, currency, description, paid_date, due_date, status, paid_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [payment.berth_plan_id, payment.service_id, payment.invoice_number, payment.supplier, payment.amount, payment.currency, payment.description, payment.paid_date, payment.due_date, payment.status, payment.paid_by]
      );
    });

    const collections = [
      { advance_payment_id: 1, amount: 8500, received_date: '2026-06-10', payer: '中远海运', payment_method: 'bank_transfer', reference_number: 'TRF-2026-0610-001', status: 'confirmed' },
    ];

    collections.forEach(col => {
      db.run(
        'INSERT INTO collections (advance_payment_id, amount, received_date, payer, payment_method, reference_number, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [col.advance_payment_id, col.amount, col.received_date, col.payer, col.payment_method, col.reference_number, col.status]
      );
    });

    const communications = [
      { related_type: 'berth', related_id: 1, from_user: 2, subject: '靠泊确认', content: '中远之星将于5月29日08:00准时靠泊B-01泊位，请协调各部门准备。', direction: 'internal' },
      { related_type: 'payment', related_id: 3, from_user: 1, subject: '催款通知', content: '您好，贵司发票INV-2026-0003已逾期，请尽快安排付款。如有问题请及时联系。', direction: 'external' },
      { related_type: 'berth', related_id: 2, from_user: 3, subject: '船员签证问题', content: '孙水手的签证将于5月28日到期，需紧急处理，否则无法登船。', direction: 'internal' },
    ];

    communications.forEach(comm => {
      db.run(
        'INSERT INTO communications (related_type, related_id, from_user, subject, content, direction) VALUES (?, ?, ?, ?, ?, ?)',
        [comm.related_type, comm.related_id, comm.from_user, comm.subject, comm.content, comm.direction]
      );
    });

    const alerts = [
      { type: 'document', title: '签证到期提醒', description: '孙水手的签证将于2026-05-28到期', related_type: 'crew', related_id: 5, priority: 'high', status: 'pending', due_date: '2026-05-28' },
      { type: 'payment', title: '付款逾期提醒', description: '船舶物料供应公司 25000元 已逾期', related_type: 'payment', related_id: 3, priority: 'high', status: 'pending', due_date: '2026-05-25' },
      { type: 'supply', title: '补给交付提醒', description: '润滑油等物料预计5月31日交付', related_type: 'supply', related_id: 2, priority: 'normal', status: 'pending', due_date: '2026-05-31' },
      { type: 'berth', title: '靠泊待确认', description: '太平洋号靠泊计划待确认', related_type: 'berth', related_id: 4, priority: 'normal', status: 'pending', due_date: '2026-06-04' },
    ];

    alerts.forEach(alert => {
      db.run(
        'INSERT INTO alerts (type, title, description, related_type, related_id, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [alert.type, alert.title, alert.description, alert.related_type, alert.related_id, alert.priority, alert.status, alert.due_date]
      );
    });

    console.log('Sample data created successfully!');
    console.log('');
    console.log('=== 测试账号 ===');
    console.log('代理经理: manager / 123456');
    console.log('现场协调: field / 123456');
    console.log('单证专员: doc / 123456');
    console.log('');
  });
}

module.exports = initSampleData;
