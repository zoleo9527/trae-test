const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

function logOperation({ operationType, refType, refId, operatorId, operatorName, action, fromStatus, toStatus, remarks, ipAddress }) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO operation_logs 
    (id, operation_type, ref_type, ref_id, operator_id, operator_name, action, from_status, to_status, remarks, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, operationType, refType, refId, operatorId, operatorName, action, fromStatus, toStatus, remarks, ipAddress);
  return id;
}

function getLogs(refType, refId) {
  return db.prepare(`
    SELECT * FROM operation_logs 
    WHERE ref_type = ? AND ref_id = ? 
    ORDER BY created_at DESC
  `).all(refType, refId);
}

module.exports = { logOperation, getLogs };
