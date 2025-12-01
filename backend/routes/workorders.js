const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const ctrl = require('../controllers/workorderController');
const { authRequired, requireRole } = require('../middleware/auth');

router.post('/', authRequired, requireRole('admin','resident'), upload.array('attachments', 6), ctrl.create);
router.get('/', authRequired, ctrl.list);
router.get('/:id', authRequired, ctrl.get);
router.put('/:id', authRequired, requireRole('admin','technician'), upload.array('attachments', 6), ctrl.update);
router.post('/:id/notes', authRequired, ctrl.addNote);
router.post('/:id/status', authRequired, requireRole('admin','technician'), ctrl.changeStatus);
router.post('/:id/rollback', authRequired, requireRole('admin'), ctrl.rollback);
router.delete('/:id', authRequired, requireRole('admin'), ctrl.remove);

module.exports = router;
