import { v4 as uuidv4 } from 'uuid'
import { getDb } from './db.js'

const userIds = {
  owner: uuidv4(),
  processor1: uuidv4(),
  processor2: uuidv4(),
  service: uuidv4(),
}

export function seedDatabase(): void {
  const db = getDb()

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
  if (userCount > 0) {
    return
  }

  const insertUser = db.prepare(
    'INSERT INTO users (id, name, role) VALUES (?, ?, ?)'
  )
  const insertFilm = db.prepare(
    `INSERT INTO film_rolls (id, roll_no, brand, model, format, customer_name, customer_contact, process_type, scan_resolution, status, assigned_processor, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertActionLog = db.prepare(
    `INSERT INTO action_logs (id, film_id, action_type, operator, operator_role, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertRework = db.prepare(
    `INSERT INTO rework_orders (id, film_id, issue_type, description, photo_urls, status, decided_by, decision, assigned_to, created_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertReworkLog = db.prepare(
    `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertConfirmation = db.prepare(
    `INSERT INTO customer_confirmations (id, film_id, delivery_version, status, customer_feedback, compensation_amount, compensation_reason, confirmed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const seedAll = db.transaction(() => {
    insertUser.run(userIds.owner, '王店长', '店主')
    insertUser.run(userIds.processor1, '李师傅', '冲印师')
    insertUser.run(userIds.processor2, '张师傅', '冲印师')
    insertUser.run(userIds.service, '赵客服', '客服')

    const film1Id = uuidv4()
    insertFilm.run(film1Id, 'FL-20260515-001', 'Kodak', 'Gold 200', '135', '陈小姐', '138-0001-0001', 'C-41', '标准', '已交付', '李师傅', '2026-05-15 09:00:00', '2026-05-17 16:30:00')
    insertActionLog.run(uuidv4(), film1Id, '接单', '赵客服', '客服', '客户陈小姐送来Kodak Gold 200一卷', '2026-05-15 09:00:00')
    insertActionLog.run(uuidv4(), film1Id, '分配冲印师', '王店长', '店主', '分配给李师傅冲印', '2026-05-15 09:15:00')
    insertActionLog.run(uuidv4(), film1Id, '开始冲印', '李师傅', '冲印师', 'C-41工艺冲印开始', '2026-05-15 10:00:00')
    insertActionLog.run(uuidv4(), film1Id, '冲印完成', '李师傅', '冲印师', 'C-41冲印完成，进入待扫描', '2026-05-15 14:00:00')
    insertActionLog.run(uuidv4(), film1Id, '开始扫描', '李师傅', '冲印师', '标准分辨率扫描', '2026-05-15 14:30:00')
    insertActionLog.run(uuidv4(), film1Id, '扫描完成', '李师傅', '冲印师', '36张扫描完成', '2026-05-15 17:00:00')
    insertActionLog.run(uuidv4(), film1Id, '质检通过', '王店长', '店主', '画质清晰，无瑕疵', '2026-05-16 09:00:00')
    insertActionLog.run(uuidv4(), film1Id, '通知客户', '赵客服', '客服', '电话通知陈小姐取件', '2026-05-16 10:00:00')
    insertActionLog.run(uuidv4(), film1Id, '交付', '赵客服', '客服', '客户取件，交付完成', '2026-05-17 16:30:00')

    const conf1Id = uuidv4()
    insertConfirmation.run(conf1Id, film1Id, 'v1', '已确认', '效果很满意！', null, null, '2026-05-17 16:00:00', '2026-05-16 11:00:00')

    const film2Id = uuidv4()
    insertFilm.run(film2Id, 'FL-20260516-001', 'Fuji', 'Superia 400', '135', '刘先生', '139-0002-0002', 'C-41', '高清', '已交付', '张师傅', '2026-05-16 10:30:00', '2026-05-18 15:00:00')
    insertActionLog.run(uuidv4(), film2Id, '接单', '赵客服', '客服', '客户刘先生送来Fuji Superia 400一卷', '2026-05-16 10:30:00')
    insertActionLog.run(uuidv4(), film2Id, '分配冲印师', '王店长', '店主', '分配给张师傅冲印', '2026-05-16 10:45:00')
    insertActionLog.run(uuidv4(), film2Id, '开始冲印', '张师傅', '冲印师', 'C-41工艺冲印开始', '2026-05-16 11:00:00')
    insertActionLog.run(uuidv4(), film2Id, '冲印完成', '张师傅', '冲印师', '冲印完成，进入待扫描', '2026-05-16 15:00:00')
    insertActionLog.run(uuidv4(), film2Id, '开始扫描', '张师傅', '冲印师', '高清分辨率扫描', '2026-05-16 15:30:00')
    insertActionLog.run(uuidv4(), film2Id, '扫描完成', '张师傅', '冲印师', '36张高清扫描完成', '2026-05-16 18:00:00')
    insertActionLog.run(uuidv4(), film2Id, '质检通过', '王店长', '店主', '色彩还原准确', '2026-05-17 09:00:00')
    insertActionLog.run(uuidv4(), film2Id, '通知客户', '赵客服', '客服', '微信通知刘先生取件', '2026-05-17 09:30:00')
    insertActionLog.run(uuidv4(), film2Id, '交付', '赵客服', '客服', '客户取件完成', '2026-05-18 15:00:00')

    const conf2Id = uuidv4()
    insertConfirmation.run(conf2Id, film2Id, 'v1', '已确认', '颜色很好看', null, null, '2026-05-18 14:30:00', '2026-05-17 10:00:00')

    const film3Id = uuidv4()
    insertFilm.run(film3Id, 'FL-20260518-001', 'Ilford', 'HP5 Plus', '120', '周先生', '137-0003-0003', 'BW', '超清', '已质检', '李师傅', '2026-05-18 11:00:00', '2026-05-21 10:00:00')
    insertActionLog.run(uuidv4(), film3Id, '接单', '赵客服', '客服', '客户周先生送来Ilford HP5 Plus 120卷', '2026-05-18 11:00:00')
    insertActionLog.run(uuidv4(), film3Id, '分配冲印师', '王店长', '店主', '分配给李师傅黑白冲印', '2026-05-18 11:15:00')
    insertActionLog.run(uuidv4(), film3Id, '开始冲印', '李师傅', '冲印师', 'BW工艺冲印开始，D-76显影', '2026-05-18 14:00:00')
    insertActionLog.run(uuidv4(), film3Id, '冲印完成', '李师傅', '冲印师', '黑白冲印完成，进入待扫描', '2026-05-18 18:00:00')
    insertActionLog.run(uuidv4(), film3Id, '开始扫描', '李师傅', '冲印师', '超清分辨率扫描', '2026-05-19 09:00:00')
    insertActionLog.run(uuidv4(), film3Id, '扫描完成', '李师傅', '冲印师', '12张超清扫描完成', '2026-05-19 12:00:00')
    insertActionLog.run(uuidv4(), film3Id, '质检通过', '王店长', '店主', '黑白对比度好，颗粒细腻', '2026-05-21 10:00:00')

    const film4Id = uuidv4()
    insertFilm.run(film4Id, 'FL-20260520-001', 'Kodak', 'Portra 400', '135', '林小姐', '136-0004-0004', 'C-41', '高清', '待扫描', '张师傅', '2026-05-20 14:00:00', '2026-05-21 15:00:00')
    insertActionLog.run(uuidv4(), film4Id, '接单', '赵客服', '客服', '客户林小姐送来Kodak Portra 400一卷', '2026-05-20 14:00:00')
    insertActionLog.run(uuidv4(), film4Id, '分配冲印师', '王店长', '店主', '分配给张师傅冲印', '2026-05-20 14:15:00')
    insertActionLog.run(uuidv4(), film4Id, '开始冲印', '张师傅', '冲印师', 'C-41工艺冲印开始', '2026-05-20 15:00:00')
    insertActionLog.run(uuidv4(), film4Id, '冲印完成', '张师傅', '冲印师', '冲印完成，进入待扫描', '2026-05-21 09:00:00')

    const film5Id = uuidv4()
    insertFilm.run(film5Id, 'FL-20260522-001', 'Fuji', 'Velvia 50', '120', '吴先生', '135-0005-0005', 'E-6', '超清', '冲印中', '李师傅', '2026-05-22 09:30:00', '2026-05-23 10:00:00')
    insertActionLog.run(uuidv4(), film5Id, '接单', '赵客服', '客服', '客户吴先生送来Fuji Velvia 50 120卷', '2026-05-22 09:30:00')
    insertActionLog.run(uuidv4(), film5Id, '分配冲印师', '王店长', '店主', '分配给李师傅E-6冲印', '2026-05-22 09:45:00')
    insertActionLog.run(uuidv4(), film5Id, '开始冲印', '李师傅', '冲印师', 'E-6工艺冲印开始', '2026-05-22 10:30:00')

    const film6Id = uuidv4()
    insertFilm.run(film6Id, 'FL-20260517-002', 'Kodak', 'Ektar 100', '135', '孙小姐', '133-0006-0006', 'C-41', '高清', '待交付', null, '2026-05-17 13:00:00', '2026-05-22 11:00:00')
    insertActionLog.run(uuidv4(), film6Id, '接单', '赵客服', '客服', '客户孙小姐送来Kodak Ektar 100一卷', '2026-05-17 13:00:00')
    insertActionLog.run(uuidv4(), film6Id, '分配冲印师', '王店长', '店主', '分配给李师傅冲印', '2026-05-17 13:15:00')
    insertActionLog.run(uuidv4(), film6Id, '开始冲印', '李师傅', '冲印师', 'C-41工艺冲印开始', '2026-05-17 14:00:00')
    insertActionLog.run(uuidv4(), film6Id, '冲印完成', '李师傅', '冲印师', '冲印完成', '2026-05-17 18:00:00')
    insertActionLog.run(uuidv4(), film6Id, '开始扫描', '李师傅', '冲印师', '高清分辨率扫描', '2026-05-18 09:00:00')
    insertActionLog.run(uuidv4(), film6Id, '扫描完成', '李师傅', '冲印师', '扫描完成，发现色偏问题', '2026-05-18 12:00:00')

    const rework6Id = uuidv4()
    insertRework.run(rework6Id, film6Id, '色偏', '整体偏绿，疑似药水温度偏高导致', '[]', '已闭环', '王店长', '返工', '李师傅', '2026-05-18 13:00:00', '2026-05-21 10:00:00')
    insertReworkLog.run(uuidv4(), rework6Id, '创建返工单', '王店长', '店主', '色偏问题，整体偏绿，决定返工重新冲印', '2026-05-18 13:00:00')
    insertReworkLog.run(uuidv4(), rework6Id, '审批通过', '王店长', '店主', '判定为返工，药水温度异常导致', '2026-05-18 14:00:00')
    insertReworkLog.run(uuidv4(), rework6Id, '开始返工', '李师傅', '冲印师', '重新调整药水温度，重新冲印', '2026-05-19 09:00:00')
    insertReworkLog.run(uuidv4(), rework6Id, '返工完成', '李师傅', '冲印师', '返工冲印完成，色彩正常', '2026-05-19 14:00:00')
    insertReworkLog.run(uuidv4(), rework6Id, '复核通过', '王店长', '店主', '返工后色彩正常，可以交付', '2026-05-20 09:00:00')
    insertReworkLog.run(uuidv4(), rework6Id, '关闭返工单', '王店长', '店主', '返工闭环', '2026-05-21 10:00:00')

    insertActionLog.run(uuidv4(), film6Id, '发现色偏问题', '李师傅', '冲印师', '扫描后发现整体偏绿，提交返工', '2026-05-18 12:30:00')
    insertActionLog.run(uuidv4(), film6Id, '返工冲印完成', '李师傅', '冲印师', '返工后重新扫描完成', '2026-05-19 15:00:00')
    insertActionLog.run(uuidv4(), film6Id, '质检通过', '王店长', '店主', '返工后画质正常', '2026-05-20 09:30:00')
    insertActionLog.run(uuidv4(), film6Id, '通知客户', '赵客服', '客服', '通知孙小姐返工已完成，可取件', '2026-05-22 11:00:00')

    const conf6Id = uuidv4()
    insertConfirmation.run(conf6Id, film6Id, 'v2', '已确认', '返工后效果好了很多，谢谢', null, null, '2026-05-22 14:00:00', '2026-05-22 11:30:00')

    const film7Id = uuidv4()
    insertFilm.run(film7Id, 'FL-20260519-002', 'Fuji', 'C200', '135', '郑先生', '131-0007-0007', 'C-41', '标准', '待交付', null, '2026-05-19 10:00:00', '2026-05-24 16:00:00')
    insertActionLog.run(uuidv4(), film7Id, '接单', '赵客服', '客服', '客户郑先生送来Fuji C200两卷', '2026-05-19 10:00:00')
    insertActionLog.run(uuidv4(), film7Id, '分配冲印师', '王店长', '店主', '分配给张师傅冲印', '2026-05-19 10:15:00')
    insertActionLog.run(uuidv4(), film7Id, '开始冲印', '张师傅', '冲印师', 'C-41工艺冲印开始', '2026-05-19 11:00:00')
    insertActionLog.run(uuidv4(), film7Id, '冲印完成', '张师傅', '冲印师', '冲印完成', '2026-05-19 15:00:00')
    insertActionLog.run(uuidv4(), film7Id, '开始扫描', '张师傅', '冲印师', '标准分辨率扫描', '2026-05-19 15:30:00')
    insertActionLog.run(uuidv4(), film7Id, '扫描完成', '张师傅', '冲印师', '扫描完成，发现划痕', '2026-05-19 18:00:00')

    const rework7Id = uuidv4()
    insertRework.run(rework7Id, film7Id, '划痕', '第12-18张有明显划痕，疑似冲片时刮伤', '[]', '待复核', '王店长', '返工', '张师傅', '2026-05-20 09:00:00', null)
    insertReworkLog.run(uuidv4(), rework7Id, '创建返工单', '张师傅', '冲印师', '发现划痕问题，提交返工', '2026-05-20 09:00:00')
    insertReworkLog.run(uuidv4(), rework7Id, '审批通过', '王店长', '店主', '判定返工，重新冲印受影响部分', '2026-05-20 10:00:00')
    insertReworkLog.run(uuidv4(), rework7Id, '开始返工', '张师傅', '冲印师', '重新冲印受影响胶片', '2026-05-21 09:00:00')
    insertReworkLog.run(uuidv4(), rework7Id, '返工完成', '张师傅', '冲印师', '返工冲印完成，划痕消除', '2026-05-21 14:00:00')

    insertActionLog.run(uuidv4(), film7Id, '发现划痕', '张师傅', '冲印师', '扫描后发现划痕，提交返工', '2026-05-19 18:30:00')
    insertActionLog.run(uuidv4(), film7Id, '返工冲印完成', '张师傅', '冲印师', '划痕问题返工完成', '2026-05-21 15:00:00')
    insertActionLog.run(uuidv4(), film7Id, '质检通过', '王店长', '店主', '返工后无划痕', '2026-05-22 09:00:00')
    insertActionLog.run(uuidv4(), film7Id, '通知客户', '赵客服', '客服', '通知郑先生返工完成', '2026-05-24 16:00:00')

    const conf7Id = uuidv4()
    insertConfirmation.run(conf7Id, film7Id, 'v2', '不满意', '还是有轻微痕迹，希望赔付', null, null, null, '2026-05-24 17:00:00')

    const film8Id = uuidv4()
    insertFilm.run(film8Id, 'FL-20260521-002', 'Kodak', 'Vision3 500T', '135', '黄先生', '130-0008-0008', 'ECN-2', '超清', '待质检', '李师傅', '2026-05-21 15:00:00', '2026-05-26 11:00:00')
    insertActionLog.run(uuidv4(), film8Id, '接单', '赵客服', '客服', '客户黄先生送来Kodak Vision3 500T电影卷', '2026-05-21 15:00:00')
    insertActionLog.run(uuidv4(), film8Id, '分配冲印师', '王店长', '店主', '分配给李师傅ECN-2冲印', '2026-05-21 15:15:00')
    insertActionLog.run(uuidv4(), film8Id, '开始冲印', '李师傅', '冲印师', 'ECN-2工艺冲印开始', '2026-05-21 16:00:00')
    insertActionLog.run(uuidv4(), film8Id, '冲印完成', '李师傅', '冲印师', 'ECN-2冲印完成', '2026-05-22 10:00:00')
    insertActionLog.run(uuidv4(), film8Id, '开始扫描', '李师傅', '冲印师', '超清分辨率扫描', '2026-05-22 10:30:00')
    insertActionLog.run(uuidv4(), film8Id, '扫描完成', '李师傅', '冲印师', '扫描完成，发现漏冲问题', '2026-05-22 16:00:00')

    const rework8Id = uuidv4()
    insertRework.run(rework8Id, film8Id, '漏冲', '后半卷未显影，疑似装片问题', '[]', '处理中', '王店长', '返工', '李师傅', '2026-05-23 09:00:00', null)
    insertReworkLog.run(uuidv4(), rework8Id, '创建返工单', '李师傅', '冲印师', '后半卷未显影，提交返工', '2026-05-23 09:00:00')
    insertReworkLog.run(uuidv4(), rework8Id, '审批通过', '王店长', '店主', '判定返工', '2026-05-23 10:00:00')
    insertReworkLog.run(uuidv4(), rework8Id, '开始返工', '李师傅', '冲印师', '重新装片冲印后半卷', '2026-05-24 09:00:00')

    insertActionLog.run(uuidv4(), film8Id, '发现漏冲', '李师傅', '冲印师', '后半卷未显影', '2026-05-22 16:30:00')
    insertActionLog.run(uuidv4(), film8Id, '返工进行中', '李师傅', '冲印师', '重新冲印后半卷', '2026-05-24 09:30:00')

    const conf8Id = uuidv4()
    insertConfirmation.run(conf8Id, film8Id, 'v1', '需返工', '后半卷完全空白，要求重新冲印', null, null, null, '2026-05-25 10:00:00')
  })

  seedAll()
  console.log('Seed data inserted successfully')
}
