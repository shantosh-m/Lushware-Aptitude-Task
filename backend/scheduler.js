const PreventiveTask = require("./models/PreventiveTask");
const notify = require("./utils/notify");

function start() {
  const WINDOW_DAYS = Number(process.env.PM_REMINDER_WINDOW_DAYS || 3);
  const SCAN_MS = Number(process.env.PM_REMINDER_SCAN_MS || 60 * 60 * 1000); // hourly

  async function scan() {
    try {
      const now = new Date();
      const windowEnd = new Date(
        now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000
      );
      const tasks = await PreventiveTask.find({
        active: true,
        nextDue: { $gte: now, $lte: windowEnd },
      });
      for (const t of tasks) {
        const alreadyRemindedToday =
          t.lastReminderAt && now - t.lastReminderAt < 24 * 60 * 60 * 1000;
        if (alreadyRemindedToday) continue;
        if (t.assignedTo) {
          await notify.technicianByTechId(
            t.assignedTo,
            `PM due soon: ${t.title} on ${new Date(
              t.nextDue
            ).toLocaleDateString()}`,
            "pm",
            String(t._id)
          );
        } else {
          await notify.admins(
            `Unassigned PM due soon: ${t.title} on ${new Date(
              t.nextDue
            ).toLocaleDateString()}`,
            "pm",
            String(t._id)
          );
        }
        t.lastReminderAt = now;
        await t.save();
      }
    } catch (e) {
      /* ignore errors */
    }
  }

  // Initial scan and interval
  scan();
  setInterval(scan, SCAN_MS);
}

module.exports = { start };
