const express = require('express');
const router = express.Router();
const verifyAccessToken = require('../middleware/auth');
const Report = require('../models/Report');

// Controllers
const {
  submitDriveLink,
  evaluateAssignment
} = require('../controllers/reportController');

// 🔥 Submit Drive Link
router.post('/submit-link', verifyAccessToken, submitDriveLink);

// 🔥 Evaluate Assignment (Admin)
router.post('/evaluate-assignment', verifyAccessToken, evaluateAssignment);

// 🔥 Get all reports
router.get('/:studentId', verifyAccessToken, async (req, res) => {
  try {
    const reports = await Report.find({ student: req.params.studentId });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// 🔥 Get latest report per module
router.get('/latest/:studentId', verifyAccessToken, async (req, res) => {
  try {
    const allReports = await Report.find({ student: req.params.studentId }).sort({ day: -1 });

    const latestPerModule = {};
    for (const report of allReports) {
      if (!latestPerModule[report.module]) {
        latestPerModule[report.module] = report;
      }
    }

    res.json(Object.values(latestPerModule));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;