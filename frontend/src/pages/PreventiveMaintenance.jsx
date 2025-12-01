import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const frequencies = ["Daily", "Weekly", "Monthly", "Quarterly", "Annually"];

export default function PreventiveMaintenance() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    frequency: "Monthly",
    nextDue: new Date().toISOString().substring(0, 10),
    asset: [],
    assignedTo: "",
  });
  const [checklistInput, setChecklistInput] = useState("");
  const [assets, setAssets] = useState([]);
  const [techs, setTechs] = useState([]);
  const [editTask, setEditTask] = useState(null);

  const toast = useToast();
  const auth = useAuth();

  const load = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/pm", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setList(res.data);
    } catch (e) {
      console.error(e);
      toast.push("Failed to load tasks", "error");
    }
  };

  // Load assets and technicians
  const fetchMeta = async () => {
    try {
      const [a, t] = await Promise.all([
        axios.get("http://localhost:4000/api/assets", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
        axios.get("http://localhost:4000/api/technicians"),
      ]);
      setAssets(a.data);
      setTechs(t.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    fetchMeta();
  }, []);

  useEffect(() => {
    if (open && auth.user?.role === "technician" && !editTask) {
      setForm((prev) => ({ ...prev, assignedTo: auth.user._id }));
    }
  }, [open]);

  const selectedTech = techs.find((t) => t._id === form.assignedTo);
  const filteredAssets =
    !selectedTech || !selectedTech.skills
      ? assets
      : assets.filter((a) => selectedTech.skills.includes(a.category));

  // Create or Update task
  const submit = async () => {
    if (!form.title) {
      toast.push("Title is required", "error");
      return;
    }
    if (auth.user?.role === "admin" && !form.assignedTo) {
      toast.push("Please select a technician", "error");
      return;
    }

    const checklistArray = checklistInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text, done: false }));

    try {
      if (editTask) {
        await axios.put(
          `http://localhost:4000/api/pm/${editTask._id}`,
          { ...form, checklist: checklistArray },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        toast.push("Preventive task updated", "success");
      } else {
        await axios.post(
          "http://localhost:4000/api/pm",
          { ...form, checklist: checklistArray },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        toast.push("Preventive task created", "success");
      }

      setOpen(false);
      setEditTask(null);
      setForm({
        title: "",
        frequency: "Monthly",
        nextDue: new Date().toISOString().substring(0, 10),
        asset: [],
        assignedTo: "",
      });
      setChecklistInput("");
      load();
    } catch (err) {
      console.error(err);
      toast.push("Error creating/updating task", "error");
    }
  };

  const handleToggleChecklist = async (taskId, index, currentValue, text) => {
    const newDone = !currentValue;

    setList((prev) =>
      prev.map((task) => {
        if (task._id === taskId) {
          const updatedChecklist = task.checklist.map((item, idx) =>
            idx === index ? { ...item, done: newDone } : item
          );
          return { ...task, checklist: updatedChecklist };
        }
        return task;
      })
    );

    try {
      await axios.post(
        `http://localhost:4000/api/pm/${taskId}/checklist/${index}/toggle`,
        { done: newDone }, // optional if backend toggles itself
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
    } catch (err) {
      console.error(err);
      toast.push("Failed to update checklist", "error");
      load();
    }
  };

  const markComplete = async (task) => {
    try {
      await axios.post(
        `http://localhost:4000/api/pm/${task._id}/complete`,
        { checklist: task.checklist },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      toast.push("Task completed", "success");
      load();
    } catch (err) {
      console.error(err);
      toast.push("Failed to complete task", "error");
    }
  };

  const startEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      frequency: task.frequency,
      nextDue:
        task.nextDue?.substring(0, 10) ||
        new Date().toISOString().substring(0, 10),
      asset: task.asset || [],
      assignedTo: task.assignedTo || "",
    });
    setChecklistInput(task.checklist?.map((c) => c.text).join(", ") || "");
    setOpen(true);
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete this task?")) {
      await axios.delete(`http://localhost:4000/api/pm/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      toast.push("Task deleted", "info");
      load();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Preventive Maintenance</h2>
        {(auth.user?.role === "admin" || auth.user?.role === "technician") && (
          <Button
            variant="contained"
            onClick={() => {
              setEditTask(null);
              setOpen(true);
            }}
          >
            New PM Task
          </Button>
        )}
      </div>

      {/* Task List */}
      <div className="grid gap-3">
        {list.map((t) => (
          <div key={t._id} className="bg-white rounded shadow p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-gray-600">
                  Frequency: {t.frequency}
                </p>
                <p className="text-xs">
                  Next Due:{" "}
                  {t.nextDue ? new Date(t.nextDue).toLocaleDateString() : "n/a"}
                </p>
                {auth.user?.role === "admin" && t.assignedTo && (
                  <p className="text-xs text-gray-600">
                    Assigned To: {t.assignedTo.name}
                  </p>
                )}
              </div>

              <Stack direction="row" spacing={1}>
                {(auth.user?.role === "admin" ||
                  auth.user?.role === "technician") && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteTask(t._id)}
                    >
                      Delete
                    </Button>
                    {auth.user?.role === "technician" && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => markComplete(t)}
                      >
                        Complete
                      </Button>
                    )}
                  </>
                )}
              </Stack>
            </div>

            {t.checklist && t.checklist.length > 0 && (
              <div className="mt-2 space-y-1">
                {t.checklist.map((c, i) => (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        checked={c.done}
                        onChange={() =>
                          handleToggleChecklist(t._id, i, c.done, c.text)
                        }
                        disabled={auth.user?.role !== "technician"}
                      />
                    }
                    label={c.text}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditTask(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editTask ? "Edit Preventive Task" : "New Preventive Task"}
        </DialogTitle>
        <DialogContent className="space-y-4">
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            select
            label="Frequency"
            fullWidth
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            {frequencies.map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="Next Due"
            fullWidth
            value={form.nextDue}
            onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
          />
          <TextField
            label="Checklist (comma separated)"
            fullWidth
            value={checklistInput}
            onChange={(e) => setChecklistInput(e.target.value)}
          />

          {auth.user?.role === "admin" && (
            <FormControl fullWidth>
              <InputLabel id="tech-label">Technician</InputLabel>
              <Select
                labelId="tech-label"
                label="Technician"
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                disabled={!!editTask}
              >
                {techs.map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel id="asset-label">Assets</InputLabel>
            <Select
              labelId="asset-label"
              label="Assets"
              value={form.asset}
              onChange={(e) => setForm({ ...form, asset: e.target.value })}
              multiple
            >
              {filteredAssets.length === 0 && (
                <MenuItem disabled>No assets found</MenuItem>
              )}
              {filteredAssets.map((a) => (
                <MenuItem key={a._id} value={a._id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditTask(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={submit}>
            {editTask ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
