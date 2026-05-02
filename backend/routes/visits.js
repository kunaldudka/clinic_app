const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const db = getDb();
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/patients/:patientId/visits
router.get('/', authenticateToken, (req, res) => {
  const { patientId } = req.params;

  const patient = db.prepare('SELECT id FROM patients WHERE id = ? AND is_deleted = 0').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const visits = db.prepare(`
    SELECT v.*, u.full_name as created_by_name,
           (SELECT COUNT(*) FROM prescriptions p WHERE p.visit_id = v.id AND p.is_deleted = 0) as prescription_count
    FROM visits v
    LEFT JOIN users u ON v.created_by = u.id
    WHERE v.patient_id = ? AND v.is_deleted = 0
    ORDER BY v.visit_date DESC
  `).all(patientId);

  res.json(visits);
});

// POST /api/patients/:patientId/visits
router.post('/', authenticateToken, requireRole('doctor', 'admin'), [
  body('chief_complaints').optional().trim(),
  body('diagnosis').optional().trim(),
  body('observations').optional().trim(),
  body('follow_up_date').optional().isISO8601().withMessage('Invalid date format'),
  body('visit_date').optional().isISO8601().withMessage('Invalid date format'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { patientId } = req.params;
  const patient = db.prepare('SELECT id FROM patients WHERE id = ? AND is_deleted = 0').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { chief_complaints, diagnosis, observations, follow_up_date, visit_date } = req.body;

  const result = db.prepare(`
    INSERT INTO visits (patient_id, visit_date, chief_complaints, diagnosis, observations, follow_up_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    patientId,
    visit_date || new Date().toISOString().replace('T', ' ').slice(0, 19),
    chief_complaints || null,
    diagnosis || null,
    observations || null,
    follow_up_date || null,
    req.user.id
  );

  const visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(visit);
});

// GET /api/visits/:id - standalone route
router.get('/:id', authenticateToken, (req, res) => {
  const visit = db.prepare(`
    SELECT v.*, u.full_name as created_by_name, p.full_name as patient_name, p.patient_id as patient_uid
    FROM visits v
    LEFT JOIN users u ON v.created_by = u.id
    LEFT JOIN patients p ON v.patient_id = p.id
    WHERE v.id = ? AND v.is_deleted = 0
  `).get(req.params.id);

  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  res.json(visit);
});

// PUT /api/visits/:id
router.put('/:id', authenticateToken, requireRole('doctor', 'admin'), [
  body('chief_complaints').optional().trim(),
  body('diagnosis').optional().trim(),
  body('observations').optional().trim(),
  body('follow_up_date').optional().isISO8601().withMessage('Invalid date format'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const visit = db.prepare('SELECT id FROM visits WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const { chief_complaints, diagnosis, observations, follow_up_date, visit_date } = req.body;

  db.prepare(`
    UPDATE visits SET
      visit_date = COALESCE(?, visit_date),
      chief_complaints = COALESCE(?, chief_complaints),
      diagnosis = COALESCE(?, diagnosis),
      observations = COALESCE(?, observations),
      follow_up_date = COALESCE(?, follow_up_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(visit_date || null, chief_complaints || null, diagnosis || null,
         observations || null, follow_up_date || null, req.params.id);

  const updated = db.prepare('SELECT * FROM visits WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
