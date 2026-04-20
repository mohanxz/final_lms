const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/Report");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const router = express.Router();
const verifyAccessToken = require("../middleware/auth");

const quizTypes = ["Coding", "Quiz", "Assignment", "Seminar", "Theory", "Practical"];

/* ============================
   🔥 CREATE / UPDATE REPORT
============================ */
router.post("/add", verifyAccessToken, async (req, res) => {
  try {
    const { studentId, quizType, day, marksObtained, module } = req.body;

    if (!module) return res.status(400).json({ message: "Module is required" });

    // 🚫 BLOCK MANUAL ASSIGNMENT
    if (quizType === "Assignment") {
      return res.status(400).json({
        message: "Assignment marks are auto-generated. Manual entry not allowed.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const index = quizTypes.indexOf(quizType);
    if (index === -1)
      return res.status(400).json({ message: "Invalid quiz type" });

    let report = await Report.findOne({ student: studentId, day, module });

    if (!report) {
      const marksArray = [-3, -3, -3, -3, -3, -3];
      marksArray[index] = marksObtained;

      report = new Report({
        student: studentId,
        day,
        module,
        marksObtained: marksArray,
      });
    } else {
      let newMarks = Array.isArray(report.marksObtained)
        ? [...report.marksObtained]
        : [-3, -3, -3, -3, -3, -3];

      while (newMarks.length < 6) newMarks.push(-3);

      newMarks[index] = marksObtained;

      report.marksObtained = newMarks;
      report.markModified("marksObtained");
    }

    await report.save();
    res.status(201).json({ message: "Report saved successfully", report });

  } catch (err) {
    console.error("Error saving report:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   📊 FETCH ALL REPORTS
============================ */
router.get("/all", verifyAccessToken, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("student", "name")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   📊 FETCH BY BATCH (FINAL FIXED)
============================ */
router.get("/batch/:batchId", verifyAccessToken, async (req, res) => {
  try {
    const { batchId } = req.params;
    const adminUserId = req.user.id;

    const batch = await Batch.findById(batchId).lean();
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const modulesHandled = batch.admins
      .filter((a) => a.admin.toString() === adminUserId.toString())
      .map((a) => a.module);

    if (modulesHandled.length === 0) return res.json([]);

    const studentIds = await Student.find({ batch: batchId }).distinct("_id");
    if (studentIds.length === 0) return res.json([]);

    const reports = await Report.find({
      student: { $in: studentIds },
      module: { $in: modulesHandled },
    })
      .populate({
        path: "student",
        populate: { path: "user", select: "name email" },
      })
      .lean();

    // 🔥 SAFE FIX FOR Map/Object ISSUE
    const formattedReports = reports.map((r) => ({
      ...r,
      weeklyAssignments:
        r.weeklyAssignments instanceof Map
          ? Object.fromEntries(r.weeklyAssignments)
          : (typeof r.weeklyAssignments === "object" && r.weeklyAssignments !== null
              ? r.weeklyAssignments
              : {}),
    }));

    res.json(formattedReports);

  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   🏆 ADMIN LEADERBOARD
============================ */
router.get("/admin-leaderboard", verifyAccessToken, async (req, res) => {
  try {
    const { batchId, module } = req.query;
    const userId = req.user.id;

    if (!batchId || !module)
      return res.status(400).json({ message: "batchId and module required" });

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const isAuthorized = batch.admins.some(
      (a) => a.admin.toString() === userId && a.module === module
    );

    if (!isAuthorized)
      return res.status(403).json({ message: "Not authorized for this module" });

    const studentIds = await Student.find({ batch: batchId }).distinct("_id");

    const topStudents = await Report.aggregate([
      {
        $match: {
          student: { $in: studentIds },
          module: module,
        },
      },
      {
        $group: {
          _id: "$student",
          total: { $sum: { $sum: "$marksObtained" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          avg: {
            $divide: ["$total", { $multiply: ["$count", 6] }],
          },
        },
      },
      { $sort: { avg: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "users",
          localField: "student.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          avg: { $round: ["$avg", 2] },
        },
      },
    ]);

    res.json(topStudents);

  } catch (err) {
    console.error("❌ Error in /admin-leaderboard:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;