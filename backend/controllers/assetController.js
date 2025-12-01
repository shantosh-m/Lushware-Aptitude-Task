const Asset = require('../models/Asset');

exports.create = async (req, res) => { try { const asset = await Asset.create(req.body); res.status(201).json(asset); } catch (e) { res.status(500).json({ error: e.message }); } };
exports.list = async (req, res) => {
	let q = {};
	if (req.user && req.user.role === 'technician') {
		try {
			const Technician = require('../models/Technician');
			const tech = await Technician.findOne({ email: req.user.email });
			if (tech && tech.skills && tech.skills.length) {
				q = { category: { $in: tech.skills } };
			} else {
				// No skills configured; return empty set for technicians
				return res.json([]);
			}
		} catch (e) { return res.status(500).json({ error: e.message }); }
	}
	const assets = await Asset.find(q).sort({ name: 1 });
	res.json(assets);
};
exports.get = async (req, res) => { const a = await Asset.findById(req.params.id); if (!a) return res.status(404).json({ error: 'Not found' }); res.json(a); };
exports.update = async (req, res) => { try { const a = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(a); } catch (e) { res.status(500).json({ error: e.message }); } };
exports.remove = async (req, res) => { await Asset.findByIdAndDelete(req.params.id); res.json({ ok: true }); };
