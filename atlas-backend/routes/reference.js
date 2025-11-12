// routes/reference.js - Reference data API routes
const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  }
  next();
};

// GET /reference/medications
router.get('/medications', (req, res) => {
  try {
    const { search, category, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM medications';
    const params = [];
    const conditions = [];
    
    if (search) {
      conditions.push('(name LIKE ? OR category LIKE ?)');
      const searchTerm = `%+search+%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name ASC LIMIT ?';
    params.push(parseInt(limit));
    
    const medications = db.prepare(query).all(...params);
    
    const processedMedications = medications.map(med => ({
      ...med,
      dosages: med.dosages ? JSON.parse(med.dosages) : [],
      indications: med.indications ? JSON.parse(med.indications) : [],
      contraindications: med.contraindications ? JSON.parse(med.contraindications) : [],
      side_effects: med.side_effects ? JSON.parse(med.side_effects) : []
    }));
    
    res.json({ data: processedMedications, total: processedMedications.length, type: 'medications' });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications', message: error.message });
  }
});

// GET /reference/conditions
router.get('/conditions', (req, res) => {
  try {
    const { search, keyword, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM conditions';
    const params = [];
    const conditions = [];
    
    if (search) {
      conditions.push('name LIKE ?');
      params.push(`%+search+%`);
    }
    
    if (keyword) {
      conditions.push('keywords LIKE ?');
      params.push(`%+keyword+%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name ASC LIMIT ?';
    params.push(parseInt(limit));
    
    const conditionsData = db.prepare(query).all(...params);
    
    const processedConditions = conditionsData.map(condition => ({
      ...condition,
      symptoms: condition.symptoms ? JSON.parse(condition.symptoms) : [],
      diagnostics: condition.diagnostics ? JSON.parse(condition.diagnostics) : [],
      treatments: condition.treatments ? JSON.parse(condition.treatments) : [],
      keywords: condition.keywords ? JSON.parse(condition.keywords) : []
    }));
    
    res.json({ data: processedConditions, total: processedConditions.length, type: 'conditions' });
  } catch (error) {
    console.error('Error fetching conditions:', error);
    res.status(500).json({ error: 'Failed to fetch conditions', message: error.message });
  }
});

// GET /reference/guidelines
router.get('/guidelines', (req, res) => {
  try {
    const { category, resource_level, search, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM guidelines';
    const params = [];
    const conditions = [];
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (resource_level) {
      conditions.push('resource_level = ?');
      params.push(resource_level);
    }
    
    if (search) {
      conditions.push('(title LIKE ? OR content LIKE ?)');
      const searchTerm = `%+search+%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY last_updated DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const guidelines = db.prepare(query).all(...params);
    
    const processedGuidelines = guidelines.map(guideline => ({
      ...guideline,
      content: guideline.content ? JSON.parse(guideline.content) : {}
    }));
    
    res.json({ data: processedGuidelines, total: processedGuidelines.length, type: 'guidelines' });
  } catch (error) {
    console.error('Error fetching guidelines:', error);
    res.status(500).json({ error: 'Failed to fetch guidelines', message: error.message });
  }
});

module.exports = router;
