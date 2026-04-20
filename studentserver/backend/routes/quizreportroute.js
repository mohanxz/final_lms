// routes/quizreports.js
const router = require('express').Router();
const verifyAccessToken = require('../middleware/auth');
const Report = require('../models/Report');
const Quiz = require('../models/Quiz');
const Note = require('../models/Note');
const Student = require('../models/Student');


// 🔥 GET ALL QUIZ ATTEMPTS (STUDENT)
router.get('/quiz-attempts', verifyAccessToken, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).lean();
    if (!student) {
      return res.status(403).json({ message: "Student not found" });
    }

    const batchId = student.batch;

    // ✅ Fetch reports that contain quiz answers
    const reports = await Report.find({
      student: student._id,
      'quizAnswers.0': { $exists: true }
    }).select('module day marksObtained quizAnswers').lean();

    // ✅ Build filters for notes
    const noteFilters = reports.map(r => ({
      batch: batchId,
      module: r.module,
      day: r.day
    }));

    // ✅ Fetch all related notes
    const notes = await Note.find(
      noteFilters.length > 0 ? { $or: noteFilters } : { _id: null }
    ).select('_id module day type').lean();

    // ✅ Map notes
    const noteMap = {};
    notes.forEach(note => {
      noteMap[`${note.module}_${note.day}`] = note;
    });

    // ✅ Build response
    const enrichedReports = reports.map(r => {
      const note = noteMap[`${r.module}_${r.day}`];

      let markIndex = 1; // default quiz

      if (note) {
        switch (note.type) {
          case 'theory': markIndex = 4; break;
          case 'practical': markIndex = 5; break;
          case 'seminar': markIndex = 3; break;
          case 'assignment': markIndex = 2; break;
          default: markIndex = 1;
        }
      }

      const score = r.marksObtained?.[markIndex] ?? 0;

      return {
        module: r.module,
        day: r.day,
        noteId: note?._id || null,
        score,                  // ✅ REAL SCORE
        total: 10,              // you can make dynamic later
        answers: r.quizAnswers || []
      };
    });

    res.json(enrichedReports);

  } catch (err) {
    console.error("❌ Failed to fetch quiz attempts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// 🔥 GET QUIZ DETAIL (STUDENT)
router.get('/quiz-detail/:noteId', verifyAccessToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId).lean();
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const quiz = await Quiz.findOne({ noteId: note._id }).lean();
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(403).json({ message: "Student not found" });
    }

    const report = await Report.findOne({
      student: student._id,
      module: note.module,
      day: note.day
    }).lean();

    // ✅ Determine mark index
    let markIndex = 1;
    switch (note.type) {
      case 'theory': markIndex = 4; break;
      case 'practical': markIndex = 5; break;
      case 'seminar': markIndex = 3; break;
      case 'assignment': markIndex = 2; break;
      default: markIndex = 1;
    }

    const score = report?.marksObtained?.[markIndex] ?? 0;

    // ✅ Build detailed response
    const detail = quiz.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      selected: report?.quizAnswers?.[i] ?? null,
      correct: q.answer
    }));

    res.json({
      score,          // ✅ CORRECT SCORE
      total: quiz.questions.length,
      detail
    });

  } catch (err) {
    console.error("❌ Error fetching quiz detail:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;