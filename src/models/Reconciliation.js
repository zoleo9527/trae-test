const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reconciliation = sequelize.define('Reconciliation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reconNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  period: {
    type: DataTypes.STRING,
    allowNull: false
  },
  channelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Channels',
      key: 'id'
    }
  },
  totalShipped: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalShippedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalConfirmed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalConfirmedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalReturned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalReturnedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  balanceQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  balanceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discrepancies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'disputed', 'finalized'),
    defaultValue: 'draft'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Reconciliation;
