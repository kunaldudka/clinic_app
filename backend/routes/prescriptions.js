const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const db = getDb();
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/visits/:visitId/prescriptions
router.get('/', authenticateToken, (req, res) => {
  const { visitId } = req.params;

  const visit = db.prepare('SELECT id FROM visits WHERE id = ? AND is_deleted = 0').get(visitId);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const prescriptions = db.prepare(`
    SELECT pr.*, u.full_name as created_by_name
    FROM prescriptions pr
    LEFT JOIN users u ON pr.created_by = u.id
    WHERE pr.visit_id = ? AND pr.is_deleted = 0
    ORDER BY pr.created_at DESC
  `).all(visitId);

  const result = prescriptions.map(p => ({
    ...p,
    items: db.prepare(
      'SELECT * FROM prescription_items WHERE prescription_id = ? ORDER BY sort_order, id'
    ).all(p.id),
  }));

  res.json(result);
});

// POST /api/visits/:visitId/prescriptions
router.post('/', authenticateToken, requireRole('doctor', 'admin'), [
  body('items').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('items.*.medicine_name').trim().notEmpty().withMessage('Medicine name is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { visitId } = req.params;

  const visit = db.prepare('SELECT * FROM visits WHERE id = ? AND is_deleted = 0').get(visitId);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const { notes, investigations, items } = req.body;

  const insertPrescription = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO prescriptions (visit_id, patient_id, notes, investigations, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(visitId, visit.patient_id, notes || null, investigations || null, req.user.id);

    const prescriptionId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, special_instructions, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item, index) => {
      insertItem.run(
        prescriptionId,
        item.medicine_name,
        item.dosage || null,
        item.frequency || null,
        item.duration || null,
        item.special_instructions || null,
        index
      );
    });

    return prescriptionId;
  });

  const prescriptionId = insertPrescription();

  const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(prescriptionId);
  const prescriptionItems = db.prepare(
    'SELECT * FROM prescription_items WHERE prescription_id = ? ORDER BY sort_order'
  ).all(prescriptionId);

  res.status(201).json({ ...prescription, items: prescriptionItems });
});

// GET /api/prescriptions/:id
router.get('/:id', authenticateToken, (req, res) => {
  const prescription = db.prepare(`
    SELECT pr.*, u.full_name as created_by_name,
           p.full_name as patient_name, p.patient_id as patient_uid,
           p.date_of_birth, p.guardian_name, p.gender, p.contact_number, p.allergies
    FROM prescriptions pr
    LEFT JOIN users u ON pr.created_by = u.id
    LEFT JOIN patients p ON pr.patient_id = p.id
    WHERE pr.id = ? AND pr.is_deleted = 0
  `).get(req.params.id);

  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  const items = db.prepare(
    'SELECT * FROM prescription_items WHERE prescription_id = ? ORDER BY sort_order, id'
  ).all(req.params.id);

  const visit = db.prepare('SELECT visit_date, chief_complaints, diagnosis, follow_up_date FROM visits WHERE id = ?')
    .get(prescription.visit_id);

  res.json({ ...prescription, items, visit });
});

// PUT /api/prescriptions/:id
router.put('/:id', authenticateToken, requireRole('doctor', 'admin'), [
  body('items').optional().isArray({ min: 1 }).withMessage('At least one medicine is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const prescription = db.prepare('SELECT id FROM prescriptions WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  const { notes, investigations, items } = req.body;

  const update = db.transaction(() => {
    if (notes !== undefined || investigations !== undefined) {
      db.prepare('UPDATE prescriptions SET notes = ?, investigations = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(notes ?? null, investigations ?? null, req.params.id);
    }

    if (items && items.length > 0) {
      db.prepare('DELETE FROM prescription_items WHERE prescription_id = ?').run(req.params.id);

      const insertItem = db.prepare(`
        INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, special_instructions, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach((item, index) => {
        insertItem.run(
          req.params.id,
          item.medicine_name,
          item.dosage || null,
          item.frequency || null,
          item.duration || null,
          item.special_instructions || null,
          index
        );
      });
    }
  });

  update();

  const updated = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
  const updatedItems = db.prepare(
    'SELECT * FROM prescription_items WHERE prescription_id = ? ORDER BY sort_order'
  ).all(req.params.id);

  res.json({ ...updated, items: updatedItems });
});

module.exports = router;
