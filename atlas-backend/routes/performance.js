// routes/performance.js - Performance metrics API routes
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  }
  next();
};

// POST /performance_metrics
router.post('/', [
  body('operation').notEmpty(),
  body('duration').isNumeric()
], validateRequest, (req, res) => {
  try {
    const {
      operation, duration, additional_data = {}, device_id, user_id,
      timestamp = new Date().toISOString()
    } = req.body;

    const result = db.prepare(`
      INSERT INTO performance_metrics (operation, duration, additional_data, device_id, user_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(operation, duration, JSON.stringify(additional_data), device_id, user_id, timestamp);

    res.status(201).json({
      message: 'Performance metric recorded successfully',
      metric_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error recording performance metric:', error);
    res.status(500).json({ error: 'Failed to record performance metric', message: error.message });
  }
});

// POST /performance_metrics/batch
router.post('/batch', [
  body('metrics').isArray({ min: 1, max: 100 })
], validateRequest, (req, res) => {
  try {
    const { metrics } = req.body;
    const timestamp = new Date().toISOString();

    const insertMetric = db.prepare(`
      INSERT INTO performance_metrics (operation, duration, additional_data, device_id, user_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMetrics = db.transaction((metricsArray) => {
      const insertedIds = [];
      for (const metric of metricsArray) {
        const result = insertMetric.run(
          metric.operation, metric.duration,
          JSON.stringify(metric.additional_data || {}),
          metric.device_id, metric.user_id, metric.timestamp || timestamp
        );
        insertedIds.push(result.lastInsertRowid);
      }
      return insertedIds;
    });

    const insertedIds = insertMetrics(metrics);

    res.status(201).json({
      message: `{metrics.length} performance metrics recorded successfully`,
      metric_ids: insertedIds,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error recording performance metrics batch:', error);
    res.status(500).json({ error: 'Failed to record performance metrics', message: error.message });
  }
});

// GET /performance_metrics
router.get('/', (req, res) => {
  try {
    const { hours = 24, operation, device_id, user_id, limit = 100, offset = 0 } = req.query;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = 'SELECT * FROM performance_metrics WHERE timestamp >= ?';
    const params = [cutoffTime];

    if (operation) {
      query += ' AND operation = ?';
      params.push(operation);
    }

    if (device_id) {
      query += ' AND device_id = ?';
      params.push(device_id);
    }

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const metrics = db.prepare(query).all(...params);

    const processedMetrics = metrics.map(metric => ({
      ...metric,
      additional_data: metric.additional_data ? JSON.parse(metric.additional_data) : {}
    }));

    res.json({ data: processedMetrics });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics', message: error.message });
  }
});

module.exports = router;
