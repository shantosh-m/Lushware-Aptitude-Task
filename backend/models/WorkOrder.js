const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  author: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const WorkOrderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['HVAC','Electrical','Plumbing','Fire Safety','Other'], default: 'Other' },
  priority: { type: String, enum: ['Low','Medium','High','Emergency'], default: 'Low' },
  status: { type: String, enum: ['Open','In Progress','Completed','Verified'], default: 'Open' },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  attachments: [String],
  notes: [NoteSchema],
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  scheduledAt: Date,
  completedAt: Date,
  statusHistory: [{
    from: String,
    to: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    rollback: { type: Boolean, default: false }
  }]
});

module.exports = mongoose.model('WorkOrder', WorkOrderSchema);
