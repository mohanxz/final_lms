const express = require("express");
const router = express.Router();
const Practical = require("../models/Practical");
const PracticalSubmission = require("../models/PracticalSubmission");
const verifyAccessToken = require("../middleware/auth");
const Note = require("../models/Note");
const Report = require("../models/Report");

// GET practical questions by noteId
router.get("/:noteId", verifyAccessToken, async (req, res) => {
  try {
    const questions = await Practical.find({ noteId: req.params.noteId });
    if (!questions || questions.length === 0) return res.status(404).json({ message: "Practical questions not found" });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST practical submission
router.post("/submit/:noteId/:studentId", verifyAccessToken, async (req, res) => {
  const { noteId, studentId } = req.params;
  const { results, earnedScore, maxScore } = req.body;

  try {
    const submission = await PracticalSubmission.findOneAndUpdate(
      { noteId, studentId },
      { 
        results,
        earnedScore,
        maxScore,
        submittedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    // Sync with Report (slot 5 is Practical)
    const note = await Note.findById(noteId);
    if (note) {
      const report = await Report.findOne({ student: studentId, module: note.module, day: note.day });
      if (report) {
         report.marksObtained[5] = earnedScore;
         report.markModified('marksObtained');
         await report.save();
      } else {
         const marks = [-3, -3, -3, -3, -3, -3];
         marks[5] = earnedScore;
         const newReport = new Report({
            student: studentId,
            module: note.module,
            day: note.day,
            marksObtained: marks
         });
         await newReport.save();
      }
    }

    res.json({ message: "Practical submission saved", id: submission._id });
  } catch (err) {
    console.error("Error saving practical submission:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
