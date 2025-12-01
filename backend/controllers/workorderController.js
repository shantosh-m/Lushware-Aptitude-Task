const WorkOrder = require('../models/WorkOrder');
const notify = require('../utils/notify');

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    payload.requestedBy = req.user.id; 
    // Technicians are not allowed to create work orders
    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Technicians cannot create work orders' });
    }
    // Resident create rules: cannot assign technician, but can set priority; status must be Open
    if (req.user.role === 'resident') {
      delete payload.technician;
      payload.status = 'Open';
    }
    // Treat empty asset from forms as undefined
    if (!payload.asset) delete payload.asset;
    if (req.files) payload.attachments = req.files.map(f => `/uploads/${f.filename}`);
    const wo = await WorkOrder.create(payload);
    // Notify admins of new work order
    const requesterName = req.user?.name || 'User';
    await notify.admins(`New work order: ${wo.title} (by ${requesterName})`, 'workorder', String(wo._id));
    // If assigned at creation, notify technician
    if (wo.technician) {
      await notify.technicianByTechId(wo.technician, `You were assigned to work order: ${wo.title}`, 'workorder', String(wo._id));
      notify.assigned(wo);
    }
    res.status(201).json(await wo.populate('asset technician requestedBy'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.user && req.user.role === 'resident') filter.requestedBy = req.user.id;
  if (req.user && req.user.role === 'technician') {
    // Only show work orders assigned to this technician
    if (!req.user.assignedTechnicianId) return res.json([]);
    filter.technician = req.user.assignedTechnicianId;
  }
  const list = await WorkOrder.find(filter).populate('asset technician requestedBy').sort({ createdAt: -1 });
  res.json(list);
};

exports.get = async (req, res) => {
  const wo = await WorkOrder.findById(req.params.id).populate('asset technician requestedBy');
  if (!wo) return res.status(404).json({ error: 'Not found' });
  if (req.user && req.user.role==='resident' && String(wo.requestedBy) !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user && req.user.role==='technician') {
    if (!wo.technician || String(wo.technician._id || wo.technician) !== (req.user.assignedTechnicianId || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  res.json(wo);
};

exports.update = async (req, res) => {
  try {
    const wo = await WorkOrder.findById(req.params.id);
    if (!wo) return res.status(404).json({ error: 'Not found' });
    // Role-based field control
    const allowedFieldsAdmin = ['title','description','category','priority','asset','technician'];
    // Technicians cannot reassign technicians; they can update description only
    const allowedFieldsTech = ['description'];
    const body = req.body;
    const allowed = req.user.role==='admin' ? allowedFieldsAdmin : allowedFieldsTech;
    allowed.forEach(f=> { if (body[f] !== undefined) wo[f] = body[f]; });
    // If admin is assigning a technician, optionally validate skill-category match
    if (req.user.role==='admin' && body.technician !== undefined) {
      const Technician = require('../models/Technician');
      const tech = await Technician.findById(body.technician);
      if (!tech) return res.status(400).json({ error: 'Technician not found' });
      const cat = body.category || wo.category;
      if (cat && cat !== 'Other' && tech.skills && !tech.skills.includes(cat)) {
        return res.status(400).json({ error: 'Technician not qualified for selected category' });
      }
      wo.technician = tech._id;
      await notify.technicianByTechId(tech._id, `You were assigned to work order: ${wo.title}`, 'workorder', String(wo._id));
    }
    if (req.files && req.files.length>0) {
      wo.attachments = wo.attachments.concat(req.files.map(f=>`/uploads/${f.filename}`));
    }
    await wo.save();
    res.json(await wo.populate('asset technician requestedBy'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addNote = async (req, res) => {
  const { text, author } = req.body;
  const wo = await WorkOrder.findById(req.params.id);
  if (!wo) return res.status(404).json({ error: 'Not found' });
  // Residents cannot add notes unless they are the requester
  if (req.user.role==='resident' && String(wo.requestedBy) !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  // Technicians can add notes only if assigned to them
  if (req.user.role==='technician') {
    if (!wo.technician || String(wo.technician._id || wo.technician) !== (req.user.assignedTechnicianId || '')) return res.status(403).json({ error: 'Forbidden' });
  }
  wo.notes.push({ text, author });
  await wo.save();
  res.json(await wo.populate('asset technician requestedBy'));
};

exports.changeStatus = async (req, res) => {
  const { status } = req.body;
  const wo = await WorkOrder.findById(req.params.id);
  if (!wo) return res.status(404).json({ error: 'Not found' });
  // Enforce role-based status changes
  if (req.user.role === 'resident') return res.status(403).json({ error: 'Residents cannot change status' });
  if (req.user.role === 'technician') {
    // Must be assigned to this technician
    if (!wo.technician || String(wo.technician._id || wo.technician) !== (req.user.assignedTechnicianId || '')) return res.status(403).json({ error: 'Forbidden' });
    if (!['Open','In Progress','Completed'].includes(status)) return res.status(400).json({ error: 'Technicians can set status to Open, In Progress, or Completed' });
  }
  // Require technician assignment before advancing to In Progress, Completed, or Verified
  if (!wo.technician && ['In Progress','Completed','Verified'].includes(status)) {
    return res.status(400).json({ error: 'Assign a technician before advancing status' });
  }
  const prev = wo.status;
  if (prev === status) return res.json(await wo.populate('asset technician requestedBy'));
  wo.status = status;
  if (status === 'Completed') wo.completedAt = new Date();
  if (prev === 'Completed' && status !== 'Completed') wo.completedAt = undefined; // rollback case via direct change
  wo.statusHistory.push({ from: prev, to: status, changedBy: req.user.id });
  await wo.save();
  try {
    // Notify requester and assigned technician about status change
    if (wo.requestedBy) await notify.user(wo.requestedBy, `Work order '${wo.title}' status changed: ${prev} → ${status}`, 'workorder', String(wo._id));
    if (wo.technician) await notify.technicianByTechId(wo.technician, `Work order '${wo.title}' status changed: ${prev} → ${status}`, 'workorder', String(wo._id));
  } catch (_) {}
  res.json(await wo.populate('asset technician requestedBy'));
};

exports.remove = async (req, res) => {
  const wo = await WorkOrder.findById(req.params.id);
  if (!wo) return res.status(404).json({ error: 'Not found' });
  await wo.deleteOne();
  res.json({ ok: true });
};

exports.rollback = async (req, res) => {
  const wo = await WorkOrder.findById(req.params.id);
  if (!wo) return res.status(404).json({ error: 'Not found' });
  if (!wo.statusHistory || wo.statusHistory.length === 0) return res.status(400).json({ error: 'No history' });
  const last = wo.statusHistory[wo.statusHistory.length - 1];
  const target = last.from;
  const current = wo.status;
  if (current === target) return res.status(400).json({ error: 'Already at previous state' });
  // Apply rollback
  if (current === 'Completed') wo.completedAt = undefined;
  wo.status = target;
  wo.statusHistory.push({ from: current, to: target, changedBy: req.user.id, rollback: true });
  await wo.save();
  res.json(await wo.populate('asset technician requestedBy'));
};
