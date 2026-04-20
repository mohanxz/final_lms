const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dob: Date,
  phone: String,
  salary: Number,
  specialisation: [String],
  upi: String,
  paidForMonth: Number,
  department: String,
  lastOrderId: { type: String },
  lastPaymentId: { type: String },
  invoiceId : {type : String},
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
