const db = require('./index');

const ensureSortOrderColumn = () => {
  try {
    const columns = db.prepare("PRAGMA table_info(followup_tasks)").all();
    const hasSortOrder = columns.some(c => c.name === 'sort_order');

    if (!hasSortOrder) {
      console.log('迁移：添加 sort_order 字段到 followup_tasks 表...');
      db.exec('ALTER TABLE followup_tasks ADD COLUMN sort_order INTEGER DEFAULT 0');
      
      const followups = db.prepare(`
        SELECT id, scheduled_date, created_at 
        FROM followup_tasks 
        ORDER BY scheduled_date, created_at
      `).all();
      
      if (followups.length > 0) {
        let currentDate = null;
        let orderInDate = 0;
        const updateStmt = db.prepare('UPDATE followup_tasks SET sort_order = ? WHERE id = ?');
        
        const updateMany = db.transaction((items) => {
          for (const item of items) {
            if (item.scheduled_date !== currentDate) {
              currentDate = item.scheduled_date;
              orderInDate = 0;
            }
            updateStmt.run(orderInDate, item.id);
            orderInDate++;
          }
        });
        
        updateMany(followups);
        console.log(`迁移完成：已初始化 ${followups.length} 条记录的 sort_order`);
      }
    }
  } catch (error) {
    console.error('迁移失败:', error.message);
    throw error;
  }
};

module.exports = { ensureSortOrderColumn };
