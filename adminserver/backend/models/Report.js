const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  assignmentNumber: Number,
  driveLink: String,
  submittedAt: Date,
  status: {
    type: String,
    enum: ["pending", "evaluated"],
    default: "evaluated"
  },
  marks: Number,
  day: Number
}, { _id: false });

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  module: {
    type: String,
    required: true
  },

  // 🔥 NEW: week-based system
  weekNumber: {
    type: Number,
    required: true
  },

  // 🔥 OLD system (keep for quiz, coding, etc.)
  day: {
    type: Number,
    default: null
  },

  marksObtained: {
    type: [Number],
    default: [-3, -3, -3, -3, -3, -3], 
    // coding, quiz, assignment, seminar, theory, practical
    validate: {
      validator: function (v) {
        return v.length === 6;
      },
      message: "marksObtained must be an array of 6 numbers"
    }
  },

  // 🔥 NEW: assignment storage
  weeklyAssignments: {
    type: Map,
    of: assignmentSchema,
    default: {}
  },

  // 🔥 NEW: total assignment score
  weeklyTotal: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🔥 IMPORTANT INDEX
reportSchema.index({ student: 1, module: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);