const { run } = require('../config/database');

const logActivity = async (quoteId, actionType, actionDetail, operatorId, operatorName) => {
  await run(`
    INSERT INTO activity_logs (quote_id, action_type, action_detail, operator_id, operator_name)
    VALUES (?, ?, ?, ?, ?)
  `, [quoteId, actionType, actionDetail, operatorId, operatorName]);
};

module.exports = { logActivity };
