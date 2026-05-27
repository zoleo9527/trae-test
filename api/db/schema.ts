import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.resolve(DB_DIR, 'studio.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      order_no TEXT NOT NULL UNIQUE,
      shoot_date TEXT NOT NULL,
      select_date TEXT,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled',
      collection_level INTEGER NOT NULL DEFAULT 0,
      current_reschedule_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reschedule_requests (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      suggested_from TEXT NOT NULL,
      suggested_to TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      approver_role TEXT,
      approver_name TEXT,
      approved_at TEXT,
      reject_reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      method TEXT NOT NULL,
      result TEXT NOT NULL,
      remark TEXT,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS retouch_versions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      version_no INTEGER NOT NULL,
      remark TEXT,
      created_at TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_reschedule_order ON reschedule_requests(order_id);
    CREATE INDEX IF NOT EXISTS idx_collection_order ON collection_records(order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_shoot ON orders(shoot_date);
  `);
}

initSchema();
seedIfEmpty();

export function seedIfEmpty() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  if (count > 0) return;

  const now = new Date().toISOString();
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const at = (offsetDays: number, h = 10, m = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_name, order_no, shoot_date, select_date, total_amount, paid_amount, status, collection_level, current_reschedule_id, created_at, updated_at)
    VALUES (@id, @customer_name, @order_no, @shoot_date, @select_date, @total_amount, @paid_amount, @status, @collection_level, @current_reschedule_id, @created_at, @updated_at)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO timeline_events (id, order_id, type, actor_role, actor_name, at, payload)
    VALUES (@id, @order_id, @type, @actor_role, @actor_name, @at, @payload)
  `);

  const insertReschedule = db.prepare(`
    INSERT INTO reschedule_requests (id, order_id, suggested_from, suggested_to, reason, status, approver_role, approver_name, approved_at, reject_reason, created_at)
    VALUES (@id, @order_id, @suggested_from, @suggested_to, @reason, @status, @approver_role, @approver_name, @approved_at, @reject_reason, @created_at)
  `);

  const insertCollection = db.prepare(`
    INSERT INTO collection_records (id, order_id, method, result, remark, actor_role, actor_name, created_at)
    VALUES (@id, @order_id, @method, @result, @remark, @actor_role, @actor_name, @created_at)
  `);

  const insertRetouch = db.prepare(`
    INSERT INTO retouch_versions (id, order_id, version_no, remark, created_at, actor_role, actor_name)
    VALUES (@id, @order_id, @version_no, @remark, @created_at, @actor_role, @actor_name)
  `);

  const orders = [
    {
      id: 'o-001',
      customer_name: '林若晴 & 陈启昊',
      order_no: 'WS2026-0527-001',
      shoot_date: day(-7),
      select_date: day(-4),
      total_amount: 12800,
      paid_amount: 5000,
      status: 'awaiting_payment',
      collection_level: 1,
    },
    {
      id: 'o-002',
      customer_name: '许梦涵 & 陆知行',
      order_no: 'WS2026-0527-002',
      shoot_date: day(3),
      select_date: null,
      total_amount: 9800,
      paid_amount: 3000,
      status: 'rescheduling',
      collection_level: 0,
    },
    {
      id: 'o-003',
      customer_name: '苏婉清 & 何承骏',
      order_no: 'WS2026-0527-003',
      shoot_date: day(-14),
      select_date: day(-10),
      total_amount: 15800,
      paid_amount: 6000,
      status: 'overdue',
      collection_level: 3,
    },
    {
      id: 'o-004',
      customer_name: '顾思淼 & 周子墨',
      order_no: 'WS2026-0527-004',
      shoot_date: day(-3),
      select_date: day(-1),
      total_amount: 8800,
      paid_amount: 3000,
      status: 'selected',
      collection_level: 0,
    },
    {
      id: 'o-005',
      customer_name: '柳书瑶 & 韩霁川',
      order_no: 'WS2026-0527-005',
      shoot_date: day(-20),
      select_date: day(-16),
      total_amount: 10800,
      paid_amount: 10800,
      status: 'completed',
      collection_level: 0,
    },
    {
      id: 'o-006',
      customer_name: '温以宁 & 裴景明',
      order_no: 'WS2026-0527-006',
      shoot_date: day(10),
      select_date: null,
      total_amount: 13800,
      paid_amount: 4000,
      status: 'scheduled',
      collection_level: 0,
    },
  ];

  const reschedules = [
    {
      id: 'rs-001',
      order_id: 'o-002',
      suggested_from: day(1),
      suggested_to: day(10),
      reason: '客户出差，申请改到 6 月周末',
      status: 'pending',
      approver_role: null,
      approver_name: null,
      approved_at: null,
      reject_reason: null,
      created_at: at(-1, 11, 20),
    },
    {
      id: 'rs-002',
      order_id: 'o-003',
      suggested_from: day(-14),
      suggested_to: day(-7),
      reason: '客户临时生病，延后一周',
      status: 'approved',
      approver_role: 'manager',
      approver_name: '店长·周嘉诚',
      approved_at: at(-12, 9, 0),
      reject_reason: null,
      created_at: at(-13, 15, 0),
    },
    {
      id: 'rs-003',
      order_id: 'o-003',
      suggested_from: day(-5),
      suggested_to: day(2),
      reason: '客户要求再次改期，婚纱需重做',
      status: 'rejected',
      approver_role: 'manager',
      approver_name: '店长·周嘉诚',
      approved_at: null,
      reject_reason: '档期已满，先完成本次拍摄再协商',
      created_at: at(-4, 14, 0),
    },
  ];

  const collections = [
    {
      id: 'cl-001',
      order_id: 'o-001',
      method: 'wechat',
      result: 'contacted',
      remark: '已发微信，客户说本周内处理',
      actor_role: 'butler',
      actor_name: '管家·谢予安',
      created_at: at(-1, 16, 0),
    },
    {
      id: 'cl-002',
      order_id: 'o-003',
      method: 'phone',
      result: 'responded',
      remark: '电话沟通，客户说本周三前转账',
      actor_role: 'butler',
      actor_name: '管家·谢予安',
      created_at: at(-6, 10, 30),
    },
    {
      id: 'cl-003',
      order_id: 'o-003',
      method: 'wechat',
      result: 'escalated',
      remark: '客户未回复，已升级店长介入',
      actor_role: 'selector',
      actor_name: '选片师·江书言',
      created_at: at(-2, 11, 0),
    },
    {
      id: 'cl-004',
      order_id: 'o-005',
      method: 'wechat',
      result: 'paid',
      remark: '客户通过转账完成尾款',
      actor_role: 'butler',
      actor_name: '管家·谢予安',
      created_at: at(-5, 14, 20),
    },
  ];

  const retouches = [
    {
      id: 'rt-001',
      order_id: 'o-001',
      version_no: 1,
      remark: '初修 62 张，客户反馈肤色偏黄',
      created_at: at(-5, 15, 0),
      actor_role: 'selector',
      actor_name: '选片师·江书言',
    },
    {
      id: 'rt-002',
      order_id: 'o-001',
      version_no: 2,
      remark: '二修：肤色调整完成',
      created_at: at(-2, 10, 30),
      actor_role: 'selector',
      actor_name: '选片师·江书言',
    },
    {
      id: 'rt-003',
      order_id: 'o-003',
      version_no: 1,
      remark: '初修完成，客户未反馈',
      created_at: at(-9, 15, 0),
      actor_role: 'selector',
      actor_name: '选片师·江书言',
    },
    {
      id: 'rt-004',
      order_id: 'o-005',
      version_no: 1,
      remark: '初修+精修完成，客户满意',
      created_at: at(-12, 16, 0),
      actor_role: 'selector',
      actor_name: '选片师·江书言',
    },
  ];

  const events = [
    {
      id: 'e-001', order_id: 'o-001', type: 'status',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-8, 9, 0),
      payload: JSON.stringify({ from: 'scheduled', to: 'selected', note: '拍摄顺利，已安排选片' }),
    },
    {
      id: 'e-002', order_id: 'o-001', type: 'retouch',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-5, 15, 0),
      payload: JSON.stringify({ version_no: 1, remark: '初修 62 张，客户反馈肤色偏黄' }),
    },
    {
      id: 'e-003', order_id: 'o-001', type: 'status',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-4, 11, 0),
      payload: JSON.stringify({ from: 'selected', to: 'awaiting_payment', note: '选片完成，进入尾款阶段' }),
    },
    {
      id: 'e-004', order_id: 'o-001', type: 'collection',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-1, 16, 0),
      payload: JSON.stringify({ method: 'wechat', result: 'contacted', remark: '已发微信，客户说本周内处理' }),
    },
    {
      id: 'e-005', order_id: 'o-001', type: 'note',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(0, 9, 30),
      payload: JSON.stringify({ content: '客户希望再看一次外景原片' }),
    },

    {
      id: 'e-100', order_id: 'o-002', type: 'note',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-3, 14, 0),
      payload: JSON.stringify({ content: '客户确认原档期 5-28' }),
    },
    {
      id: 'e-101', order_id: 'o-002', type: 'reschedule',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-1, 11, 20),
      payload: JSON.stringify({ reschedule_id: 'rs-001', action: 'created', from: day(1), to: day(10), reason: '客户出差，申请改到 6 月周末' }),
    },
    {
      id: 'e-102', order_id: 'o-002', type: 'status',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-1, 11, 21),
      payload: JSON.stringify({ from: 'scheduled', to: 'rescheduling', note: '进入改期流程' }),
    },
    {
      id: 'e-103', order_id: 'o-002', type: 'note',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(0, 10, 0),
      payload: JSON.stringify({ content: '客户电话确认可接受新档期' }),
    },

    {
      id: 'e-200', order_id: 'o-003', type: 'reschedule',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-13, 15, 0),
      payload: JSON.stringify({ reschedule_id: 'rs-002', action: 'created', from: day(-14), to: day(-7), reason: '客户临时生病，延后一周' }),
    },
    {
      id: 'e-201', order_id: 'o-003', type: 'reschedule',
      actor_role: 'manager', actor_name: '店长·周嘉诚', at: at(-12, 9, 0),
      payload: JSON.stringify({ reschedule_id: 'rs-002', action: 'approved' }),
    },
    {
      id: 'e-202', order_id: 'o-003', type: 'status',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-10, 10, 0),
      payload: JSON.stringify({ from: 'scheduled', to: 'selected', note: '改期后拍摄完成' }),
    },
    {
      id: 'e-203', order_id: 'o-003', type: 'retouch',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-9, 15, 0),
      payload: JSON.stringify({ version_no: 1, remark: '初修完成，客户未反馈' }),
    },
    {
      id: 'e-204', order_id: 'o-003', type: 'status',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-8, 10, 0),
      payload: JSON.stringify({ from: 'selected', to: 'awaiting_payment', note: '选片完成，进入尾款阶段' }),
    },
    {
      id: 'e-205', order_id: 'o-003', type: 'reschedule',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-4, 14, 0),
      payload: JSON.stringify({ reschedule_id: 'rs-003', action: 'created', from: day(-5), to: day(2), reason: '客户要求再次改期，婚纱需重做' }),
    },
    {
      id: 'e-206', order_id: 'o-003', type: 'reschedule',
      actor_role: 'manager', actor_name: '店长·周嘉诚', at: at(-3, 10, 0),
      payload: JSON.stringify({ reschedule_id: 'rs-003', action: 'rejected', reject_reason: '档期已满，先完成本次拍摄再协商' }),
    },
    {
      id: 'e-207', order_id: 'o-003', type: 'collection',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-6, 10, 30),
      payload: JSON.stringify({ method: 'phone', result: 'responded', remark: '电话沟通，客户说本周三前转账' }),
    },
    {
      id: 'e-208', order_id: 'o-003', type: 'status',
      actor_role: 'manager', actor_name: '店长·周嘉诚', at: at(-1, 9, 0),
      payload: JSON.stringify({ from: 'awaiting_payment', to: 'overdue', note: '升级为逾期订单' }),
    },
    {
      id: 'e-209', order_id: 'o-003', type: 'collection',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-2, 11, 0),
      payload: JSON.stringify({ method: 'wechat', result: 'escalated', remark: '客户未回复，已升级店长介入' }),
    },
    {
      id: 'e-210', order_id: 'o-003', type: 'note',
      actor_role: 'manager', actor_name: '店长·周嘉诚', at: at(0, 9, 0),
      payload: JSON.stringify({ content: '已电话回访，客户情绪激动，重点跟进' }),
    },

    {
      id: 'e-300', order_id: 'o-004', type: 'status',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-3, 14, 0),
      payload: JSON.stringify({ from: 'scheduled', to: 'selected', note: '拍摄完成，等待选片' }),
    },
    {
      id: 'e-301', order_id: 'o-004', type: 'status',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-1, 11, 0),
      payload: JSON.stringify({ from: 'selected', to: 'awaiting_payment', note: '选片完成' }),
    },

    {
      id: 'e-400', order_id: 'o-005', type: 'status',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-20, 10, 0),
      payload: JSON.stringify({ from: 'scheduled', to: 'selected', note: '拍摄顺利' }),
    },
    {
      id: 'e-401', order_id: 'o-005', type: 'retouch',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-12, 16, 0),
      payload: JSON.stringify({ version_no: 1, remark: '初修+精修完成，客户满意' }),
    },
    {
      id: 'e-402', order_id: 'o-005', type: 'status',
      actor_role: 'selector', actor_name: '选片师·江书言', at: at(-10, 10, 0),
      payload: JSON.stringify({ from: 'selected', to: 'awaiting_payment', note: '选片完成' }),
    },
    {
      id: 'e-403', order_id: 'o-005', type: 'collection',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-5, 14, 20),
      payload: JSON.stringify({ method: 'wechat', result: 'paid', remark: '客户通过转账完成尾款' }),
    },
    {
      id: 'e-404', order_id: 'o-005', type: 'status',
      actor_role: 'manager', actor_name: '店长·周嘉诚', at: at(-5, 14, 25),
      payload: JSON.stringify({ from: 'awaiting_payment', to: 'completed', note: '尾款结清，订单完成' }),
    },

    {
      id: 'e-500', order_id: 'o-006', type: 'note',
      actor_role: 'butler', actor_name: '管家·谢予安', at: at(-1, 11, 0),
      payload: JSON.stringify({ content: '客户确认档期，提醒提前到店选婚纱' }),
    },
  ];

  const insertMany = db.transaction((rows: any[], stmt) => {
    for (const r of rows) stmt.run(r);
  });

  const orderRows = orders.map(o => ({
    ...o,
    current_reschedule_id: null,
    created_at: now,
    updated_at: now,
  }));
  insertMany(orderRows, insertOrder);
  insertMany(reschedules, insertReschedule);
  insertMany(collections, insertCollection);
  insertMany(retouches, insertRetouch);
  insertMany(events, insertEvent);

  db.prepare('UPDATE orders SET current_reschedule_id = ? WHERE id = ?').run('rs-001', 'o-002');
}
