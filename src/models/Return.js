const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Return = sequelize.define('Return', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  returnNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'SampleShipments',
      key: 'id'
    }
  },
  requestDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returnReason: {
    type: DataTypes.ENUM('quality_issue', 'slow_sales', 'wrong_shipment', 'damage', 'other'),
    allowNull: false
  },
  returnReasonDetail: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requestedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approvedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  trackingNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receivedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  receivedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'shipped', 'received', 'reconciled', 'rejected'),
    defaultValue: 'pending'
  },
  caliberType: {
    type: DataTypes.ENUM('original', 'channel', 'finance'),
    defaultValue: 'original'
  },
  caliberNotes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  },
  reconciledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reconciledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Return;
