const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pmController");
const { authRequired, requireRole } = require("../middleware/auth");

router.post("/", authRequired, requireRole("admin", "technician"), ctrl.create);
router.get("/", authRequired, ctrl.list);
router.put("/:id", authRequired, requireRole("admin", "technician"), ctrl.update);
router.delete("/:id", authRequired, requireRole("admin", "technician"), ctrl.remove);

router.get("/calendar/range", authRequired, ctrl.calendar);
router.get("/:id", authRequired, ctrl.get);
router.post("/:id/complete", authRequired, requireRole("admin", "technician"), ctrl.markCompleted);
router.post("/:id/checklist/:index/toggle", authRequired, requireRole("admin", "technician"), ctrl.toggleChecklist);

module.exports = router;
