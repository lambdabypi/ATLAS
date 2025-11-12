// routes/patients.js - Patient management API routes
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  }
  next();
};

// GET /patients
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let query = 'SELECT * FROM patients WHERE is_deleted = 0';
    const params = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchTerm = `%+search+%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const patients = db.prepare(query).all(...params);
    
    const countQuery = 'SELECT COUNT(*) as total FROM patients WHERE is_deleted = 0' + 
      (search ? ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)' : '');
    const countParams = search ? [`%+search+%`, `%+search+%`, `%+search+%`] : [];
    const { total } = db.prepare(countQuery).get(...countParams);
    
    res.json({
      data: patients,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset) }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients', message: error.message });
  }
});

// GET /patients/:id
router.get('/:id', [param('id').isInt({ min: 1 })], validateRequest, (req, res) => {
  try {
    const { id } = req.params;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ? AND is_deleted = 0').get(id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient', message: error.message });
  }
});

// POST /patients
router.post('/', [
  body('name').notEmpty().trim(),
  body('age').optional().isInt({ min: 0, max: 150 }),
  body('gender').optional().isIn(['Male', 'Female', 'Other', 'Unknown'])
], validateRequest, (req, res) => {
  try {
    const { name, age, gender, phone, email, address, medical_history, allergies, current_medications } = req.body;
    
    const result = db.prepare(`
      INSERT INTO patients (name, age, gender, phone, email, address, medical_history, allergies, current_medications, created_by, modified_by, last_modified_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'api', 'api', 'API User')
    `).run(name, age, gender, phone, email, address, medical_history, allergies, current_medications);
    
    const newPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ message: 'Patient created successfully', patient: newPatient });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient', message: error.message });
  }
});

// PUT /patients/:id
router.put('/:id', [param('id').isInt({ min: 1 })], validateRequest, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const existing = db.prepare('SELECT id FROM patients WHERE id = ? AND is_deleted = 0').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const updateFields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`{key} = ?`);
        values.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    updateFields.push('modified_by = ?', 'last_modified_by = ?', 'sync_version = sync_version + 1');
    values.push('api', 'API User', id);
    
    const result = db.prepare(`UPDATE patients SET +updateFields.join(', ')+ WHERE id = ?`).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Update failed' });
    }
    
    const updatedPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    res.json({ message: 'Patient updated successfully', patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient', message: error.message });
  }
});

// DELETE /patients/:id
router.delete('/:id', [param('id').isInt({ min: 1 })], validateRequest, (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('UPDATE patients SET is_deleted = 1, sync_version = sync_version + 1 WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully', deleted_id: parseInt(id) });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient', message: error.message });
  }
});

module.exports = router;
