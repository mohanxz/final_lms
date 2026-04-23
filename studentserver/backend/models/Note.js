const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  meetlink: String,
  assignmentlink: String,
  assignmentS3Url: { type: String, default: "" },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  module: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  day: { type: Number, required: true },
  weekNumber: { type: Number, default: 1 }, // NEW: Track which week this belongs to
  type: { type: String, enum: ["seminar", "practical", "theory", "regular", "hackerrank"], default: "regular" },
}, { timestamps: true });

noteSchema.index({ batch: 1, module: 1, day: 1 }, { unique: true });
module.exports = mongoose.model('Note', noteSchema);