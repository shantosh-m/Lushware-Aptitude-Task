const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (user) => jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email exists' });
    const user = new User({ email, name, role: role || 'resident' });
    await user.setPassword(password);
    await user.save();
    const token = sign(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await user.validatePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: user.toJSON() });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};
