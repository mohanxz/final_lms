const express = require("express");
const router = express.Router();
const CodingQuestion = require("../models/Code");
const CodeSubmission = require("../models/CodeSubmission");
const verifyAccessToken = require("../middleware/auth");
const Note = require("../models/Note");
const Report = require("../models/Report");

// GET coding question by noteId
router.get("/:noteId", verifyAccessToken, async (req, res) => {
  try {
    const questions = await CodingQuestion.find({ noteId: req.params.noteId });
    if (!questions || questions.length === 0) return res.status(404).json({ message: "Coding questions not found" });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST code submission
router.post("/submit/:noteId/:studentId", verifyAccessToken, async (req, res) => {
  const { noteId, studentId } = req.params;
  const { code, language, results, earnedScore, maxScore } = req.body;

  try {
    // Check for existing and update, or create new submission
    const submission = await CodeSubmission.findOneAndUpdate(
      { noteId, studentId },
      { 
        code: code || (results?.[0]?.code), 
        language: language || (results?.[0]?.lang),
        results,
        earnedScore,
        maxScore,
        submittedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    // Sync with Report
    const note = await Note.findById(noteId);
    if (note) {
      const report = await Report.findOne({ student: studentId, module: note.module, day: note.day });
      if (report) {
         report.marksObtained[0] = earnedScore;
         report.markModified('marksObtained');
         await report.save();
      } else {
         // Create if missing
         const newReport = new Report({
            student: studentId,
            module: note.module,
            day: note.day,
            marksObtained: [earnedScore, -1, -1]
         });
         await newReport.save();
      }
    }

    res.json({ message: "Submission saved", id: submission._id });
  } catch (err) {
    console.error("Error saving submission:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// Check if code has been submitted
router.get("/submission-status/:noteId/:studentId", verifyAccessToken, async (req, res) => {
  try {
    const { noteId,studentId } = req.params;

    const existing = await CodeSubmission.findOne({ noteId, studentId });
    res.json({ submitted: !!existing });
  } catch (err) {
    console.error("Error checking code submission:", err);
    res.status(500).json({ error: "Server error" });
  }
});




module.exports = router;
