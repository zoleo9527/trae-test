const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  feedbackNo: {
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
  feedbackDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  receivedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  damagedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  channelFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  salesExpectation: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    allowNull: true
  },
  displayLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marketingSupport: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'reviewed', 'escalated'),
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
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Feedback;
