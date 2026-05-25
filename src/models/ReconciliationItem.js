const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReconciliationItem = sequelize.define('ReconciliationItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reconciliationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Reconciliations',
      key: 'id'
    }
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'SampleShipments',
      key: 'id'
    }
  },
  bookId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Books',
      key: 'id'
    }
  },
  shippedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shippedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  confirmedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  confirmedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  returnedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  returnedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  difference: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  differenceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('matched', 'discrepancy', 'pending'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = ReconciliationItem;
