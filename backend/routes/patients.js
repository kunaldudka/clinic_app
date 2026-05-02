const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const db = getDb();
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate patient ID: CCC-YYYYMMDD-XXXX
function generatePatientId() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = db.prepare('SELECT COUNT(*) as cnt FROM patients').get().cnt;
  const seq = String(count + 1).padStart(4, '0');
  return `CCC-${datePart}-${seq}`;
}

// GET /api/patients - search & paginate
router.get('/', authenticateToken, (req, res) => {
  const { search = '', page = 1, limit = 20, sortBy = 'created_at', order = 'desc' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const validSortFields = ['full_name', 'patient_id', 'created_at', 'date_of_birth'];
  const validOrders = ['asc', 'desc'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

  const searchTerm = `%${search}%`;

  const patients = db.prepare(`
    SELECT p.*, u.full_name as created_by_name,
           (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id AND v.is_deleted = 0) as visit_count
    FROM patients p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.is_deleted = 0
      AND (p.full_name LIKE ? OR p.patient_id LIKE ? OR p.contact_number LIKE ?)
    ORDER BY p.${sortField} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(searchTerm, searchTerm, searchTerm, parseInt(limit), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as cnt FROM patients
    WHERE is_deleted = 0
      AND (full_name LIKE ? OR patient_id LIKE ? OR contact_number LIKE ?)
  `).get(searchTerm, searchTerm, searchTerm).cnt;

  res.json({
    patients,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// POST /api/patients - create patient
router.post('/', authenticateToken, [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('contact_number').optional().trim(),
  body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    full_name, date_of_birth, gender, contact_number,
    address, guardian_name, allergies, notes,
  } = req.body;

  const patient_id = generatePatientId();

  const result = db.prepare(`
    INSERT INTO patients (patient_id, full_name, date_of_birth, gender, contact_number,
                          address, guardian_name, allergies, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(patient_id, full_name, date_of_birth || null, gender || null, contact_number || null,
         address || null, guardian_name || null, allergies || null, notes || null, req.user.id);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(patient);
});

// GET /api/patients/:id - get single patient
router.get('/:id', authenticateToken, (req, res) => {
  const patient = db.prepare(`
    SELECT p.*, u.full_name as created_by_name
    FROM patients p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = ? AND p.is_deleted = 0
  `).get(req.params.id);

  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// PUT /api/patients/:id - update patient
router.put('/:id', authenticateToken, [
  body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const patient = db.prepare('SELECT * FROM patients WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const {
    full_name, date_of_birth, gender, contact_number,
    address, guardian_name, allergies, notes,
  } = req.body;

  db.prepare(`
    UPDATE patients SET
      full_name = COALESCE(?, full_name),
      date_of_birth = COALESCE(?, date_of_birth),
      gender = COALESCE(?, gender),
      contact_number = COALESCE(?, contact_number),
      address = COALESCE(?, address),
      guardian_name = COALESCE(?, guardian_name),
      allergies = COALESCE(?, allergies),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(full_name || null, date_of_birth || null, gender || null, contact_number || null,
         address || null, guardian_name || null, allergies || null, notes || null, req.params.id);

  const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/patients/:id - soft delete (doctor only)
router.delete('/:id', authenticateToken, requireRole('doctor', 'admin'), (req, res) => {
  const patient = db.prepare('SELECT id FROM patients WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  db.prepare('UPDATE patients SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(req.params.id);

  res.json({ message: 'Patient archived successfully' });
});

module.exports = router;
