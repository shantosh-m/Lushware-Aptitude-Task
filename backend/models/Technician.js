const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  skills: [String]
}, { timestamps: true });

module.exports = mongoose.model('Technician', TechnicianSchema);
