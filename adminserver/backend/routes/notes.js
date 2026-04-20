const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Note = require("../models/Note");
const Student = require("../models/Student");
const Report = require("../models/Report");
const verifyAccessToken = require("../middleware/auth");

/* ============================
   📚 GET NOTES BY BATCH + MODULE
============================ */
router.get("/:batchId/:module", verifyAccessToken, async (req, res) => {
  const { batchId, module } = req.params;

  try {
    const notes = await Note.find({
      batch: batchId,
      module,
    }).populate("admin", "name email");

    res.json(notes);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch notes",
      details: err.message,
    });
  }
});

/* ============================
   🔥 CREATE NOTE + SAFE REPORTS
============================ */
router.post("/", verifyAccessToken, async (req, res) => {
  const {
    title,
    meetlink,
    assignmentlink,
    assignmentS3Url,
    batch,
    module,
    admin,
    day,
    type,
  } = req.body;

  try {
    // ✅ VALIDATION
    if (!title || !batch || !module || !admin || !day) {
      return res.status(400).json({
        error: "Missing required fields",
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

    // ✅ CHECK DUPLICATE NOTE
    const existingNote = await Note.findOne({
      batch,
      module,
      day: numericDay,
    });

    if (existingNote) {
      return res.status(400).json({
        error: `Day ${numericDay} already exists for this batch`,
      });
    }

    // ✅ CREATE NOTE
    const note = new Note({
      title,
      meetlink,
      assignmentlink,
      assignmentS3Url,
      batch,
      module,
      admin,
      day: numericDay,
      weekNumber: Math.ceil(numericDay / 5),
      type: type || "regular",
    });

    await note.save();

    // ✅ GET STUDENTS
    const students = await Student.find({ batch });

    // ✅ SAFE REPORT CREATION (NO DUPLICATES)
    const bulkOps = students.map((student) => ({
      updateOne: {
        filter: {
          student: student._id,
          module,
          day: numericDay,
        },
        update: {
          $setOnInsert: {
            student: student._id,
            module,
            day: numericDay,
            weekNumber: Math.ceil(numericDay / 5),
            marksObtained: [-3, -3, -3, -3, -3, -3],
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Report.bulkWrite(bulkOps);
    }

    res.status(201).json({
      message: "Note and reports created successfully",
      note,
    });
  } catch (err) {
    console.error("❌ ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        error: "Duplicate entry detected",
      });
    }

    res.status(500).json({
      error: "Failed to add note or create reports",
      details: err.message,
    });
  }
});

/* ============================
   ✏️ UPDATE NOTE
============================ */
router.put("/:id", verifyAccessToken, async (req, res) => {
  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        day: Number(req.body.day),
      },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({
      error: "Failed to update note",
      details: err.message,
    });
  }
});

/* ============================
   📚 ADMIN NOTES
============================ */
router.get("/my-notes", verifyAccessToken, async (req, res) => {
  try {
    const adminId = req.user.id;

    const notes = await Note.find({ admin: adminId }).sort({ day: 1 });

    res.json(notes);
  } catch (error) {
    console.error("Error fetching admin notes:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ============================
   📤 UPLOAD DRIVE LINK
============================ */
router.post("/upload-drive-link", verifyAccessToken, async (req, res) => {
  try {
    const { studentId, module, day, driveLink } = req.body;

    if (!studentId || !module || !day || !driveLink) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    if (!driveLink.includes("drive.google.com")) {
      return res.status(400).json({
        error: "Invalid Google Drive link",
      });
    }

    let report = await Report.findOne({
      student: studentId,
      module,
      day: Number(day),
    });

    if (!report) {
      report = new Report({
        student: studentId,
        module,
        day: Number(day),
        marksObtained: [-3, -3, -3, -3, -3, -3],
      });
    }

    report.assignmentLink = driveLink;

    if (report.marksObtained[2] === -3) {
      report.marksObtained[2] = -1; // pending
    }

    await report.save();

    res.json({
      success: true,
      message: "Drive link submitted successfully",
      report,
    });
  } catch (error) {
    console.error("Drive link error:", error);
    res.status(500).json({
      error: "Failed to save drive link",
      details: error.message,
    });
  }
});

/* ============================
   📥 GET SUBMISSION
============================ */
router.get(
  "/submission/:studentId/:module/:day",
  verifyAccessToken,
  async (req, res) => {
    try {
      const { studentId, module, day } = req.params;

      const report = await Report.findOne({
        student: studentId,
        module,
        day: Number(day),
      });

      if (!report) {
        return res.json({ submitted: false });
      }

      res.json({
        submitted: report.marksObtained[2] !== -3,
        marks: report.marksObtained[2],
        assignmentLink: report.assignmentLink,
        status:
          report.marksObtained[2] === -1
            ? "pending"
            : report.marksObtained[2] >= 0
            ? "evaluated"
            : "not_submitted",
      });
    } catch (error) {
      console.error("Submission fetch error:", error);
      res.status(500).json({
        error: "Failed to fetch submission",
      });
    }
  }
);

module.exports = router;