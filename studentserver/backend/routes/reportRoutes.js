const express = require('express');
const router = express.Router();
const verifyAccessToken = require('../middleware/auth');
const Report = require('../models/Report');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const CodingQuestion = require('../models/Code');
const Student = require('../models/Student');

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
    const studentId = req.params.studentId;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    let reports = await Report.find({ student: studentId }).lean();

    // Map through reports to refine -3 status (Yet to Assign) to -4 (Yet to Attend)
    const augmentedReports = await Promise.all(reports.map(async (report) => {
      const marks = [...report.marksObtained];
      
      // We only care about refining -3 for the first 3 columns (Code, Quiz, Assignment)
      if (marks.slice(0, 3).includes(-3)) {
        const note = await Note.findOne({ batch: student.batch, module: report.module, day: report.day });
        if (note) {
          // Index 0: Code
          if (marks[0] === -3) {
            const code = await CodingQuestion.findOne({ noteId: note._id });
            if (code) marks[0] = -4; // Yet to Attend
          }
          // Index 1: Quiz
          if (marks[1] === -3) {
            const quiz = await Quiz.findOne({ noteId: note._id });
            if (quiz) marks[1] = -4; // Yet to Attend
          }
          // Index 2: Assignment
          if (marks[2] === -3) {
            if (note.assignmentlink || note.assignmentS3Url) marks[2] = -4; // Yet to Attend
          }
        }
      }
      return { ...report, marksObtained: marks };
    }));

    res.json(augmentedReports);
  } catch (err) {
    console.error('Error fetching reports:', err);
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