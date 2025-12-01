const PM = require("../models/PreventiveTask");
const notify = require("../utils/notify");

// Create PM
exports.create = async (req, res) => {
  try {
    const data = req.body;
    if (!data.nextDue) data.nextDue = new Date();
    const pm = await PM.create(data);

    if (pm.assignedTo) {
      await notify.technicianByTechId(
        pm.assignedTo,
        `New PM task assigned: ${pm.title}`,
        "pm",
        String(pm._id)
      );
    }

    res.status(201).json(pm);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// List PMs
exports.list = async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;

  let list;
  if (role === "admin") {
    list = await PM.find().populate("asset assignedTo").sort({ nextDue: 1 });
  } else {
    list = await PM.find({ assignedTo: userId })
      .populate("asset assignedTo")
      .sort({ nextDue: 1 });
  }

  res.json(list);
};

// Get single PM
exports.get = async (req, res) => {
  const pm = await PM.findById(req.params.id).populate("asset assignedTo");
  if (!pm) return res.status(404).json({ error: "Not found" });
  res.json(pm);
};

exports.update = async (req, res) => {
  try {
    const pm = await PM.findById(req.params.id);
    if (!pm) return res.status(404).json({ error: "Not found" });

    if (req.user.role !== "admin") delete req.body.assignedTo;

    if (req.body.checklist) {
      req.body.checklist = req.body.checklist.map((c) => ({
        text: c.text,
        completed: c.completed || false,
      }));
    }

    const updated = Object.assign(pm, req.body);
    await updated.save();

    res.json(updated);
  } catch (err) {
    console.error("PM Update Error:", err);
    res.status(500).json({ error: "Failed to update PM task" });
  }
};

// Delete PM
exports.remove = async (req, res) => {
  try {
    const pm = await PM.findByIdAndDelete(req.params.id);
    if (!pm) return res.status(404).json({ error: "Not found" });
    res.json({ message: "PM deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Mark PM as complete
exports.markCompleted = async (req, res) => {
  try {
    const task = await PM.findById(req.params.id).populate("assignedTo");
    if (!task) return res.status(404).json({ error: "Task not found" });

    console.log("Completing task:", task._id, "Checklist:", task.checklist);

    // Only assigned technician or admin can complete
    if (
      req.user.role !== "admin" &&
      (!task.assignedTo ||
        task.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: "Not authorized to complete" });
    }

    // Check if checklist exists and all items are done
    if (task.checklist && task.checklist.length > 0) {
      const allDone = task.checklist.every((c) => c.done === true);
      if (!allDone) {
        return res.status(400).json({
          error: "Cannot complete task until all checklist items are done",
        });
      }
    }

    // Update lastCompleted
    task.lastCompleted = new Date();

    // Reset checklist to all unchecked
    if (task.checklist && task.checklist.length > 0) {
      task.checklist.forEach((c) => (c.done = false));
    }

    // Update nextDue based on frequency
    const next = new Date(task.nextDue || Date.now());
    switch (task.frequency) {
      case "Daily":
        next.setDate(next.getDate() + 1);
        break;
      case "Weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "Monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "Quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "Annually":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    task.nextDue = next;

    await task.save();

    console.log("Task marked complete:", task._id);

    // Notify
    if (task.assignedTo) {
      await notify.technicianByTechId(
        task.assignedTo._id,
        `PM task "${task.title}" completed.`,
        "pm",
        String(task._id)
      );
    }
    await notify.admins(
      `PM task "${task.title}" completed.`,
      "pm",
      String(task._id)
    );

    res.json(task);
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    res
      .status(500)
      .json({ error: "Failed to complete task", details: err.message });
  }
};

// Calendar view
exports.calendar = async (req, res) => {
  const { start, end } = req.query;
  const q = {};
  if (start || end) {
    q.nextDue = {};
    if (start) q.nextDue.$gte = new Date(start);
    if (end) q.nextDue.$lte = new Date(end);
  }
  const list = await PM.find(q)
    .populate("asset assignedTo")
    .sort({ nextDue: 1 });
  res.json(list);
};

// Toggle checklist item
exports.toggleChecklist = async (req, res) => {
  try {
    const pm = await PM.findById(req.params.id);
    if (!pm) return res.status(404).json({ error: "Not found" });

    const index = Number(req.params.index);
    if (!pm.checklist || index < 0 || index >= pm.checklist.length)
      return res.status(400).json({ error: "Invalid checklist index" });

    pm.checklist[index].done = !pm.checklist[index].done;
    await pm.save();

    res.json(pm);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
