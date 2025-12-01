const mongoose = require('mongoose');

const ChecklistItem = new mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false }
});

const PreventiveTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  asset: [{type: mongoose.Schema.Types.ObjectId, ref: "Asset"}],
  frequency: { type: String, enum: ['Daily','Weekly','Monthly','Quarterly','Annually'], default: 'Monthly' },
  nextDue: { type: Date },
  active: { type: Boolean, default: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checklist: [ChecklistItem],
  lastCompleted: Date,
  lastReminderAt: Date
}, { timestamps: true });

module.exports = mongoose.model('PreventiveTask', PreventiveTaskSchema);
