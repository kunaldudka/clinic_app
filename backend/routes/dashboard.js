const express = require('express');
const { getDb } = require('../db/database');
const db = getDb();
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, (req, res) => {
  const totalPatients = db.prepare('SELECT COUNT(*) as cnt FROM patients WHERE is_deleted = 0').get().cnt;
  const todayVisits = db.prepare(`
    SELECT COUNT(*) as cnt FROM visits
    WHERE is_deleted = 0 AND DATE(visit_date) = DATE('now')
  `).get().cnt;
  const thisMonthVisits = db.prepare(`
    SELECT COUNT(*) as cnt FROM visits
    WHERE is_deleted = 0 AND strftime('%Y-%m', visit_date) = strftime('%Y-%m', 'now')
  `).get().cnt;
  const totalVisits = db.prepare('SELECT COUNT(*) as cnt FROM visits WHERE is_deleted = 0').get().cnt;

  const recentPatients = db.prepare(`
    SELECT p.id, p.patient_id, p.full_name, p.gender, p.contact_number, p.created_at,
           (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id AND v.is_deleted = 0) as visit_count
    FROM patients p
    WHERE p.is_deleted = 0
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all();

  const upcomingFollowups = db.prepare(`
    SELECT v.follow_up_date, v.id as visit_id, p.full_name as patient_name,
           p.patient_id as patient_uid, p.id as patient_id, p.contact_number
    FROM visits v
    JOIN patients p ON v.patient_id = p.id
    WHERE v.is_deleted = 0 AND p.is_deleted = 0
      AND v.follow_up_date >= DATE('now')
      AND v.follow_up_date <= DATE('now', '+7 days')
    ORDER BY v.follow_up_date ASC
    LIMIT 10
  `).all();

  res.json({
    stats: { totalPatients, todayVisits, thisMonthVisits, totalVisits },
    recentPatients,
    upcomingFollowups,
  });
});

module.exports = router;
