const express = require('express');
const mongoose = require('mongoose');
const LessonPlan = require('../models/LessonPlan');
const Report = require('../models/Report');
const Student = require('../models/Student');
const verifyAccessToken = require('../middleware/auth');

const router = express.Router();

/* ============================
   🔥 CREATE LESSON + REPORTS
============================ */
router.post("/", verifyAccessToken, async (req, res) => {
  try {
    const {
      title,
      meetlink,
      assignmentlink,
      assignmentS3Url,
      batch,
      module,
      admin,
      day,
      type
    } = req.body;

    // ✅ VALIDATION
    if (!title || !batch || !module || !admin || !day) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(batch)) {
      return res.status(400).json({ error: "Invalid batch ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(admin)) {
      return res.status(400).json({ error: "Invalid admin ID" });
    }

    const numericDay = Number(day);
    if (isNaN(numericDay)) {
      return res.status(400).json({ error: "Day must be a number" });
    }

    // ✅ CHECK DUPLICATE LESSON
    const existingLesson = await LessonPlan.findOne({
      batch,
      module,
      day: numericDay
    });

    if (existingLesson) {
      return res.status(400).json({
        error: "Lesson already exists for this day"
      });
    }

    // ✅ CREATE LESSON
    const lesson = new LessonPlan({
      title,
      meetlink,
      assignmentlink,
      assignmentS3Url,
      batch,
      module,
      admin,
      day: numericDay,
      weekNumber: Math.ceil(numericDay / 5),
      type: type || "regular"
    });

    await lesson.save();

    // ✅ FETCH STUDENTS
    const students = await Student.find({ batch });

    // ✅ CREATE REPORTS (SAFE INSERT)
    for (const student of students) {
      const existingReport = await Report.findOne({
        student: student._id,
        module,
        day: numericDay
      });

      // 🔥 ONLY CREATE IF NOT EXISTS
      if (!existingReport) {
        await Report.create({
          student: student._id,
          module,
          day: numericDay,
          weekNumber: Math.ceil(numericDay / 5),
          marksObtained: [-3, -3, -3, -3, -3, -3]
        });
      }
    }

    // ✅ SUCCESS RESPONSE
    res.status(201).json({
      message: "Lesson and reports created successfully",
      lesson
    });

  } catch (err) {
    console.error("❌ ERROR CREATING LESSON:", err);

    // 🔥 HANDLE DUPLICATE INDEX ERROR
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Duplicate entry detected"
      });
    }

    res.status(500).json({
      error: "Failed to create lesson"
    });
  }
});

/* ============================
   📚 GET LESSONS (MODULE)
============================ */
router.get("/:batchId/:module", verifyAccessToken, async (req, res) => {
  try {
    const { batchId, module } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID" });
    }

    const plans = await LessonPlan.find({
      batch: batchId,
      module: decodeURIComponent(module)
    }).sort({ day: -1 });

    res.json(plans);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   📚 GET ALL LESSONS
============================ */
router.get("/:batchId", verifyAccessToken, async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID" });
    }

    const plans = await LessonPlan.find({ batch: batchId })
      .sort({ day: -1 });

    res.json(plans);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;