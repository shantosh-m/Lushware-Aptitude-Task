const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authRequired = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    req.user = user.toJSON();
    if (!req.user.id) req.user.id = String(user._id);
    // If this is a technician, attach the corresponding Technician document id by matching email
    if (req.user.role === 'technician' && req.user.email) {
      try {
        const Technician = require('../models/Technician');
        const techDoc = await Technician.findOne({ email: req.user.email });
        if (techDoc) req.user.assignedTechnicianId = String(techDoc._id);
      } catch (_) { /* best effort */ }
    }
    next();
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};
