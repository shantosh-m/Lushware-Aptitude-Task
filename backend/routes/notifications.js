const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authRequired } = require('../middleware/auth');

router.get('/', authRequired, ctrl.listMine);
router.post('/:id/read', authRequired, ctrl.markRead);

module.exports = router;
