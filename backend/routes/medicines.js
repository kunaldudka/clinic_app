const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const { getDb } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Multer: memory storage, Excel files only, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const allowedExt = /\.(xlsx|xls)$/i;
    if (allowedMimes.includes(file.mimetype) || allowedExt.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

// GET /api/medicines/template — download sample Excel file
router.get('/template', authenticateToken, async (req, res) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Medicines');

    ws.columns = [
      { header: 'name', key: 'name', width: 30 },
      { header: 'description', key: 'description', width: 50 },
      { header: 'dosage', key: 'dosage', width: 30 },
    ];

    // Style the header row
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFD6E4F7' },
    };

    // Sample rows
    ws.addRow({ name: 'Amoxicillin 250mg', description: 'Antibiotic for bacterial infections', dosage: '5ml (250mg/5ml syrup)' });
    ws.addRow({ name: 'Paracetamol 120mg/5ml', description: 'Antipyretic and analgesic', dosage: '5–10ml based on weight' });
    ws.addRow({ name: 'Cetirizine 5mg', description: 'Antihistamine for allergies and rash', dosage: '2.5ml once daily' });
    ws.addRow({ name: 'Azithromycin 200mg/5ml', description: 'Macrolide antibiotic', dosage: '10mg/kg once daily for 3–5 days' });

    res.setHeader('Content-Disposition', 'attachment; filename="medicines_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await wb.xlsx.write(res);
  } catch (err) {
    console.error('Error generating template:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate template' });
  }
});

// GET /api/medicines/search?q=... — autocomplete (all authenticated users)
router.get('/search', authenticateToken, (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length === 0) return res.json([]);

  const db = getDb();
  const term = `%${q}%`;
  const results = db.prepare(
    `SELECT id, name, description, dosage FROM medicines
     WHERE is_deleted = 0 AND (name LIKE ? OR description LIKE ?)
     ORDER BY name LIMIT 10`
  ).all(term, term);
  res.json(results);
});

// GET /api/medicines?page=1&search=... — list all (doctor only)
router.get('/', authenticateToken, requireRole('doctor'), (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : '%';

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM medicines WHERE is_deleted = 0 AND name LIKE ?`
  ).get(search)?.count || 0;

  const medicines = db.prepare(
    `SELECT id, name, description, dosage, created_at FROM medicines
     WHERE is_deleted = 0 AND name LIKE ?
     ORDER BY name LIMIT ? OFFSET ?`
  ).all(search, limit, offset);

  res.json({ medicines, total, page, limit });
});

// POST /api/medicines/upload — Excel upload (doctor only)
router.post('/upload', authenticateToken, requireRole('doctor'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);

    const ws = wb.worksheets[0];
    if (!ws) return res.status(400).json({ error: 'Excel file has no worksheets' });

    // Read header row to find column indices
    const headerRow = ws.getRow(1).values; // 1-indexed, index 0 is undefined
    const headers = Array.isArray(headerRow)
      ? headerRow.map(h => String(h || '').toLowerCase().trim())
      : [];

    const nameIdx = headers.indexOf('name');
    const descIdx = headers.indexOf('description');
    const dosageIdx = headers.indexOf('dosage');

    if (nameIdx === -1) {
      return res.status(400).json({ error: 'Column "name" not found. Please use the template.' });
    }

    const db = getDb();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const processRows = db.transaction(() => {
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const cellVal = (idx) => {
          if (idx === -1) return '';
          const cell = row.getCell(idx);
          return String(cell.value ?? '').trim();
        };

        const name = cellVal(nameIdx);
        if (!name) { skipped++; return; }

        const description = cellVal(descIdx);
        const dosage = cellVal(dosageIdx);

        const existing = db.prepare(
          'SELECT id FROM medicines WHERE name = ? AND is_deleted = 0'
        ).get(name);

        if (existing) {
          db.prepare(
            'UPDATE medicines SET description=?, dosage=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
          ).run(description, dosage, existing.id);
          updated++;
        } else {
          db.prepare(
            'INSERT INTO medicines (name, description, dosage) VALUES (?, ?, ?)'
          ).run(name, description, dosage);
          inserted++;
        }
      });
    });

    processRows();

    res.json({ success: true, inserted, updated, skipped, total: inserted + updated });
  } catch (err) {
    console.error('Error parsing Excel:', err);
    res.status(500).json({ error: 'Failed to parse Excel file. Ensure it is a valid .xlsx file.' });
  }
});

// DELETE /api/medicines/:id — soft delete (doctor only)
router.delete('/:id', authenticateToken, requireRole('doctor'), (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  const med = db.prepare('SELECT id FROM medicines WHERE id=? AND is_deleted=0').get(id);
  if (!med) return res.status(404).json({ error: 'Medicine not found' });

  db.prepare('UPDATE medicines SET is_deleted=1, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
  res.json({ success: true });
});

module.exports = router;
