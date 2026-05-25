const sequelize = require('../config/database');
const User = require('./User');
const Book = require('./Book');
const Channel = require('./Channel');
const SampleShipment = require('./SampleShipment');
const Feedback = require('./Feedback');
const Return = require('./Return');
const Reconciliation = require('./Reconciliation');
const ReconciliationItem = require('./ReconciliationItem');
const ActivityLog = require('./ActivityLog');

SampleShipment.belongsTo(Book, { foreignKey: 'bookId' });
SampleShipment.belongsTo(Channel, { foreignKey: 'channelId' });
SampleShipment.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
SampleShipment.belongsTo(User, { as: 'confirmer', foreignKey: 'confirmedBy' });

Feedback.belongsTo(SampleShipment, { foreignKey: 'shipmentId' });
Feedback.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Feedback.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });

Return.belongsTo(SampleShipment, { foreignKey: 'shipmentId' });
Return.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Return.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
Return.belongsTo(User, { as: 'reconciler', foreignKey: 'reconciledBy' });

Reconciliation.belongsTo(Channel, { foreignKey: 'channelId' });
Reconciliation.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Reconciliation.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
Reconciliation.hasMany(ReconciliationItem, { foreignKey: 'reconciliationId' });

ReconciliationItem.belongsTo(Reconciliation, { foreignKey: 'reconciliationId' });
ReconciliationItem.belongsTo(SampleShipment, { foreignKey: 'shipmentId' });
ReconciliationItem.belongsTo(Book, { foreignKey: 'bookId' });

ActivityLog.belongsTo(User, { as: 'operator', foreignKey: 'createdBy' });

Book.hasMany(SampleShipment, { foreignKey: 'bookId' });
Channel.hasMany(SampleShipment, { foreignKey: 'channelId' });
Channel.hasMany(Reconciliation, { foreignKey: 'channelId' });

SampleShipment.hasMany(Feedback, { foreignKey: 'shipmentId' });
SampleShipment.hasMany(Return, { foreignKey: 'shipmentId' });

module.exports = {
  sequelize,
  User,
  Book,
  Channel,
  SampleShipment,
  Feedback,
  Return,
  Reconciliation,
  ReconciliationItem,
  ActivityLog
};
