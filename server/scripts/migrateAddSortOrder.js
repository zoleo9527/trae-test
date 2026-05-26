const db = require('../db');

const migrate = () => {
  try {
    const columns = db.prepare("PRAGMA table_info(followup_tasks)").all();
    const hasSortOrder = columns.some(c => c.name === 'sort_order');

    if (!hasSortOrder) {
      db.exec(`
        ALTER TABLE followup_tasks ADD COLUMN sort_order INTEGER DEFAULT 0;
      `);
      console.log('已添加 sort_order 字段');

      const followups = db.prepare('SELECT id, scheduled_date, created_at FROM followup_tasks ORDER BY scheduled_date, created_at').all();
      
      let currentDate = null;
      let orderInDate = 0;
      const updateStmt = db.prepare('UPDATE followup_tasks SET sort_order = ? WHERE id = ?');
      
      followups.forEach(f => {
        if (f.scheduled_date !== currentDate) {
          currentDate = f.scheduled_date;
          orderInDate = 0;
        }
        updateStmt.run(orderInDate, f.id);
        orderInDate++;
      });
      
      console.log(`已初始化 ${followups.length} 条记录的 sort_order`);
    } else {
      console.log('sort_order 字段已存在，跳过');
    }
  } catch (error) {
    console.error('迁移失败:', error.message);
  }
};

migrate();
