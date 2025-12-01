const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/technicianController');
const { authRequired, requireRole } = require('../middleware/auth');

router.post('/', authRequired, requireRole('admin'), ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.put('/:id', authRequired, requireRole('admin'), ctrl.update);
router.delete('/:id', authRequired, requireRole('admin'), ctrl.remove);

module.exports = router;
