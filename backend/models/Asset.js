const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  location: { type: String },
  serial: { type: String },
  details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);
