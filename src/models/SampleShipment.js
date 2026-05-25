const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SampleShipment = sequelize.define('SampleShipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  shipmentNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  bookId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Books',
      key: 'id'
    }
  },
  channelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Channels',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    min: 1
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  expressCompany: {
    type: DataTypes.STRING,
    allowNull: true
  },
  trackingNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipmentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'confirmed', 'receipt_lost', 'closed'),
    defaultValue: 'pending'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  confirmedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  receiptImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = SampleShipment;
