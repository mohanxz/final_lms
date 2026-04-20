const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  module: {
    type: String,
    required: true
  },
  day: {
    type: Number,
    required: true
  },
  weekNumber: {
    type: Number,
    default: 0
  },
  marksObtained: {
    type: [Number],
    default: [-3, -3, -3, -3, -3, -3],
    validate: {
      validator: function (v) {
        return v.length === 6;
      },
      message: "marksObtained must be an array of 6 numbers"
    }
  },
  // Weekly assignments storage
  weeklyAssignments: {
    type: Map,
    of: new mongoose.Schema({
      assignmentNumber: { type: Number, required: true }, // 1, 2, or 3
      driveLink: { type: String, default: null },
      submittedAt: { type: Date, default: null },
      marks: { type: Number, default: -1 }, // -1 = pending, 0-100 = marks
      status: { type: String, enum: ['pending', 'evaluated', 'not_submitted'], default: 'not_submitted' }
    }),
    default: {}
  },
  weeklyTotal: {
    type: Number,
    default: -1 // -1 = not calculated, 0-100 = percentage
  },
  quizAnswers: {
    type: [String],
    default: [],
    validate: {
      validator: function (answers) {
        return answers.every(ans => ['A', 'B', 'C', 'D', null].includes(ans));
      },
      message: "Each answer must be 'A', 'B', 'C', 'D', or null"
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique combination
reportSchema.index({ student: 1, module: 1, day: 1 }, { unique: true });
// Index for weekly queries
reportSchema.index({ student: 1, module: 1, weekNumber: 1 });

module.exports = mongoose.model("Report", reportSchema);