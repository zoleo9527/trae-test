const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { powerData } = require('../data/database');

const router = express.Router();

router.get('/today', authenticateToken, (req, res) => {
  res.json(powerData.today);
});

router.get('/hourly', authenticateToken, (req, res) => {
  res.json(powerData.hourly);
});

router.get('/daily', authenticateToken, (req, res) => {
  res.json(powerData.daily);
});

router.get('/monthly', authenticateToken, (req, res) => {
  res.json(powerData.monthly);
});

router.get('/by-area', authenticateToken, (req, res) => {
  res.json(powerData.byArea);
});

router.get('/alarms', authenticateToken, (req, res) => {
  res.json(powerData.alarms);
});

module.exports = router;
