const Technician = require('../models/Technician');
const User = require('../models/User');

exports.create = async (req, res) => {
	try {
		const { name, email, phone, skills } = req.body;
		const t = await Technician.create({ name, email, phone, skills });
		if (email) {
			let user = await User.findOne({ email });
			if (!user) {
				user = new User({ email, name: name || email, role: 'technician', passwordHash: 'temp' });
				await user.setPassword('TechPass1!');
				await user.save();
			}
		}
		res.status(201).json(t);
	} catch(e){ res.status(500).json({ error: e.message }); }
};
exports.list = async (_req, res) => { const list = await Technician.find().sort({ name: 1 }); res.json(list); };
exports.get = async (req, res) => { const t = await Technician.findById(req.params.id); if(!t) return res.status(404).json({ error:'Not found'}); res.json(t); };
exports.update = async (req, res) => { try { const t = await Technician.findByIdAndUpdate(req.params.id, req.body, { new:true }); res.json(t); } catch(e){ res.status(500).json({ error: e.message }); } };
exports.remove = async (req, res) => { await Technician.findByIdAndDelete(req.params.id); res.json({ ok:true }); };
