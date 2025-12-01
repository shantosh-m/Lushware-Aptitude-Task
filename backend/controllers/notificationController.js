const Notification = require('../models/Notification');

exports.listMine = async (req, res) => {
  const q = { user: req.user.id };
  const list = await Notification.find(q).sort({ read: 1, createdAt: -1 });
  res.json(list);
};

exports.markRead = async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, user: req.user.id });
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.read = true;
  await n.save();
  res.json({ ok: true });
};
