const Report = require("../models/Report");

// 🔥 Submit Drive Link (FINAL PERFECT VERSION)
exports.submitDriveLink = async (req, res) => {
  try {
    const { studentId, module, day, driveLink } = req.body;

    if (!studentId || !module || !day || !driveLink) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Calculate week
    const weekNumber = Math.ceil(day / 5);

    // ✅ Calculate week range (IMPORTANT FIX)
    const weekStart = (weekNumber - 1) * 5 + 1;
    const weekEnd = weekNumber * 5;

    // 🔥 Fetch ALL reports in that week using day range
    const weekReports = await Report.find({
      student: studentId,
      module,
      day: { $gte: weekStart, $lte: weekEnd },
    });

    // 🔥 Collect ALL assignments from week
    let allAssignments = [];

    weekReports.forEach((r) => {
      if (r.weeklyAssignments) {
        const values =
          r.weeklyAssignments instanceof Map
            ? Array.from(r.weeklyAssignments.values())
            : Object.values(r.weeklyAssignments);

        allAssignments.push(...values);
      }
    });

    // 🔥 Sort by DAY (reliable ordering)
    allAssignments.sort((a, b) => a.day - b.day);

    // 🚨 Limit check (max 3 per week)
    if (allAssignments.length >= 3) {
      return res.status(400).json({
        message: "Maximum 3 assignments allowed per week",
      });
    }

    const assignmentNumber = allAssignments.length + 1;

    // ✅ Auto scoring
    let marks = 0;
    if (assignmentNumber === 1) marks = 33;
    else if (assignmentNumber === 2) marks = 33;
    else if (assignmentNumber === 3) marks = 34;

    // 🔍 Find or create report for that day
    let report = await Report.findOne({
      student: studentId,
      module,
      day,
    });

    if (!report) {
      report = new Report({
        student: studentId,
        module,
        day,
        weekNumber,
        weeklyAssignments: new Map(),
        marksObtained: [-3, -3, -3, -3, -3, -3],
      });
    }

    // 🔥 Save assignment
    report.weeklyAssignments.set(`A${assignmentNumber}`, {
      assignmentNumber,
      driveLink,
      submittedAt: new Date(),
      day: day, // ⭐ IMPORTANT
      status: "evaluated",
      marks: marks,
    });

    // 🔥 Update marksObtained (Assignment index = 2)
    let marksArray = report.marksObtained || [-3, -3, -3, -3, -3, -3];
    while (marksArray.length < 6) marksArray.push(-3);

    if (marksArray[2] < 0) marksArray[2] = 0;
    marksArray[2] += marks;

    report.marksObtained = marksArray;
    report.markModified("marksObtained");

    // 🔥 Weekly total calculation
    const updatedAssignments = [
      ...allAssignments,
      {
        assignmentNumber,
        marks,
        day,
      },
    ];

    updatedAssignments.sort((a, b) => a.day - b.day);

    const a1 = updatedAssignments[0]?.marks || 0;
    const a2 = updatedAssignments[1]?.marks || 0;
    const a3 = updatedAssignments[2]?.marks || 0;

    report.weeklyTotal = a1 + a2 + a3;

    await report.save();

    res.json({
      message: `Assignment A${assignmentNumber} submitted`,
      marks,
      weeklyTotal: report.weeklyTotal,
    });

  } catch (err) {
    console.error("❌ submitDriveLink error:", err);
    res.status(500).json({ error: "Submission failed" });
  }
};

// ❌ Manual evaluation disabled
exports.evaluateAssignment = async (req, res) => {
  return res.json({
    message: "Manual evaluation disabled. Auto scoring enabled.",
  });
};