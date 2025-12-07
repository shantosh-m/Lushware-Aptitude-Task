import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns";
import { useAuth } from "../context/AuthContext";

export default function CalendarView() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [tasks, setTasks] = useState([]);
  const auth = useAuth();

  const load = async () => {
    try {
      const res = await axios.get("https://my-backend-r5al.onrender.com/api/pm", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      // Filter tasks: only admin sees all, technician sees only assigned tasks
      const filtered = res.data.filter(
        (t) => auth.user.role === "admin" || t.assignedTo?._id === auth.user._id
      );

      setTasks(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Check if a task occurs on a given date based on frequency
  const occursOn = (task, date) => {
    if (!task.nextDue) return false;
    const start = parseISO(task.nextDue);
    if (isSameDay(start, date)) return true;

    const diffDays = Math.floor((date - start) / (1000 * 60 * 60 * 24));
    switch (task.frequency) {
      case "Daily":
        return diffDays >= 0;
      case "Weekly":
        return diffDays >= 0 && diffDays % 7 === 0;
      case "Monthly":
        return diffDays >= 0 && start.getDate() === date.getDate();
      case "Quarterly":
        return (
          diffDays >= 0 &&
          start.getDate() === date.getDate() &&
          date.getMonth() % 3 === start.getMonth() % 3
        );
      case "Annually":
        return (
          diffDays >= 0 &&
          start.getDate() === date.getDate() &&
          start.getMonth() === date.getMonth()
        );
      default:
        return false;
    }
  };

  const rows = [];
  let day = weekStart;
  let row = [];

  while (day <= weekEnd) {
    for (let i = 0; i < 7; i++) {
      const d = day;
      const dayTasks = tasks.filter((t) => occursOn(t, d));
      row.push(
        <div
          key={d}
          className={`border p-1 h-28 flex flex-col ${
            d.getMonth() !== currentMonth.getMonth()
              ? "bg-gray-100 text-gray-400"
              : "bg-white"
          }`}
        >
          <div className="text-xs font-semibold">{format(d, "d")}</div>
          <div className="flex-1 overflow-auto space-y-1">
            {dayTasks.map((t) => (
              <div
                key={t._id}
                className="text-[10px] bg-indigo-50 rounded px-1 truncate"
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day} className="grid grid-cols-7 gap-px">
        {row}
      </div>
    );
    row = [];
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Preventive Calendar</h2>
        <div className="space-x-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            onClick={() =>
              setCurrentMonth(addDays(startOfMonth(currentMonth), -1))
            }
          >
            Prev
          </button>
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            onClick={() => setCurrentMonth(today)}
          >
            Today
          </button>
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            onClick={() =>
              setCurrentMonth(addDays(endOfMonth(currentMonth), 1))
            }
          >
            Next
          </button>
        </div>
      </div>

      <p className="mb-2 font-medium">{format(currentMonth, "MMMM yyyy")}</p>
      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="space-y-px">{rows}</div>
    </div>
  );
}
