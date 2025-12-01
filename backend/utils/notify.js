const Notification = require('../models/Notification');
const User = require('../models/User');
const Technician = require('../models/Technician');

async function create(userId, message, type = 'general', refId) {
	try {
		await Notification.create({ user: userId, message, type, refId });
	} catch (e) { /* swallow */ }
	console.log(`[Notify:${type}] ${message} -> user:${userId}`);
}

exports.user = create;

exports.admins = async (message, type = 'general', refId) => {
	const admins = await User.find({ role: 'admin' }).select('_id');
	await Promise.all(admins.map(a => create(a._id, message, type, refId)));
};

exports.technicianByTechId = async (techId, message, type = 'general', refId) => {
	const tech = await Technician.findById(techId);
	if (!tech || !tech.email) return console.log(`[Notify:skip] No user for technician ${techId}`);
	const user = await User.findOne({ email: tech.email }).select('_id');
	if (!user) return console.log(`[Notify:skip] No user record for technician email ${tech.email}`);
	await create(user._id, message, type, refId);
};

exports.assigned = (workOrder) => { console.log(`[Notify] Technician assigned to work order ${workOrder._id}`); };
exports.pmExecuted = (pt) => { console.log(`[Notify] Preventive task executed: ${pt._id}`); };
exports.alert = (msg) => { console.log(`[Alert] ${msg}`); };

