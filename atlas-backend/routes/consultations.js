// routes/consultations.js - Consultation management API routes
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

// GET /consultation
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0, patient_id } = req.query;
    
    let query = `
      SELECT c.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.is_deleted = 0 AND p.is_deleted = 0
    `;
    const params = [];
    
    if (patient_id) {
      query += ' AND c.patient_id = ?';
      params.push(parseInt(patient_id));
    }
    
    query += ' ORDER BY c.date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const consultations = db.prepare(query).all(...params);
    
    const processedConsultations = consultations.map(consultation => ({
      ...consultation,
      tags: consultation.tags ? JSON.parse(consultation.tags) : [],
      ai_recommendations: consultation.ai_recommendations ? JSON.parse(consultation.ai_recommendations) : null,
      vital_signs: consultation.vital_signs ? JSON.parse(consultation.vital_signs) : null
    }));
    
    res.json({ data: processedConsultations });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations', message: error.message });
  }
});

// GET /consultation/:id
router.get('/:id', [param('id').isInt({ min: 1 })], validateRequest, (req, res) => {
  try {
    const { id } = req.params;
    const consultation = db.prepare(`
      SELECT c.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ? AND c.is_deleted = 0 AND p.is_deleted = 0
    `).get(id);
    
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    
    const processedConsultation = {
      ...consultation,
      tags: consultation.tags ? JSON.parse(consultation.tags) : [],
      ai_recommendations: consultation.ai_recommendations ? JSON.parse(consultation.ai_recommendations) : null,
      vital_signs: consultation.vital_signs ? JSON.parse(consultation.vital_signs) : null
    };
    
    res.json(processedConsultation);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ error: 'Failed to fetch consultation', message: error.message });
  }
});

// POST /consultation
router.post('/', [
  body('patient_id').isInt({ min: 1 }).withMessage('Valid patient ID is required')
], validateRequest, (req, res) => {
  try {
    const {
      patient_id, date = new Date().toISOString(), chief_complaint, symptoms,
      physical_examination, vital_signs, diagnosis, plan, tags = [],
      ai_recommendations, final_diagnosis, provider_notes,
      provider_id = 'api', provider_name = 'API User', provider_role = 'provider'
    } = req.body;
    
    const patient = db.prepare('SELECT id, name FROM patients WHERE id = ? AND is_deleted = 0').get(patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const result = db.prepare(`
      INSERT INTO consultations (
        patient_id, date, chief_complaint, symptoms, physical_examination,
        vital_signs, diagnosis, plan, tags, ai_recommendations,
        final_diagnosis, provider_notes, provider_id, provider_name,
        provider_role, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patient_id, date, chief_complaint, symptoms, physical_examination,
      vital_signs ? JSON.stringify(vital_signs) : null, diagnosis, plan,
      JSON.stringify(tags), ai_recommendations ? JSON.stringify(ai_recommendations) : null,
      final_diagnosis, provider_notes, provider_id, provider_name, provider_role, 'api'
    );
    
    db.prepare('UPDATE patients SET last_visit = ? WHERE id = ?').run(date, patient_id);
    
    const newConsultation = db.prepare(`
      SELECT c.*, p.name as patient_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({
      message: 'Consultation created successfully',
      consultation: {
        ...newConsultation,
        tags: JSON.parse(newConsultation.tags),
        ai_recommendations: newConsultation.ai_recommendations ? JSON.parse(newConsultation.ai_recommendations) : null,
        vital_signs: newConsultation.vital_signs ? JSON.parse(newConsultation.vital_signs) : null
      }
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Failed to create consultation', message: error.message });
  }
});

// PUT /consultation/:id
router.put('/:id', [param('id').isInt({ min: 1 })], validateRequest, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const existing = db.prepare('SELECT id FROM consultations WHERE id = ? AND is_deleted = 0').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    
    const updateFields = [];
    const values = [];
    
    const allowedFields = ['patient_id', 'date', 'chief_complaint', 'symptoms', 'diagnosis', 'plan', 'final_diagnosis'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`{field} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (updates.tags !== undefined) {
      updateFields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    
    if (updates.vital_signs !== undefined) {
      updateFields.push('vital_signs = ?');
      values.push(JSON.stringify(updates.vital_signs));
    }
    
    if (updates.ai_recommendations !== undefined) {
      updateFields.push('ai_recommendations = ?');
      values.push(JSON.stringify(updates.ai_recommendations));
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    updateFields.push('sync_version = sync_version + 1');
    values.push(id);
    
    const result = db.prepare(`UPDATE consultations SET +updateFields.join(', ')+ WHERE id = ?`).run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Update failed' });
    }
    
    const updatedConsultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(id);
    res.json({ message: 'Consultation updated successfully', consultation: updatedConsultation });
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ error: 'Failed to update consultation', message: error.message });
  }
});

// DELETE /consultation/:id
router.delete('/:id', [param('id').isInt({ min: 1 })], validateRequest, (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('UPDATE consultations SET is_deleted = 1, sync_version = sync_version + 1 WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    
    res.json({ message: 'Consultation deleted successfully', deleted_id: parseInt(id) });
  } catch (error) {
    console.error('Error deleting consultation:', error);
    res.status(500).json({ error: 'Failed to delete consultation', message: error.message });
  }
});

module.exports = router;
