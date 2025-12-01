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
  Chip,
  Stack,
  Typography,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";

const categories = ["HVAC", "Electrical", "Plumbing", "Fire Safety", "Other"];
const priorities = ["Low", "Medium", "High", "Emergency"];

export default function WorkOrders() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "Low",
    asset: [],
    technician: "",
  });
  const [files, setFiles] = useState([]);
  const [assets, setAssets] = useState([]);
  const [techs, setTechs] = useState([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [currentWO, setCurrentWO] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editWO, setEditWO] = useState(null);
  const [editFiles, setEditFiles] = useState([]);
  const toast = useToast();
  const auth = useAuth();
  const filteredAssets =
    form.category === "Other"
      ? assets
      : assets.filter((a) => a.category === form.category);
  const filteredEditAssets =
    form.category === "Other"
      ? assets
      : assets.filter((a) => a.category === form.category);


  const load = async () => {
    const res = await axios.get("http://localhost:4000/api/workorders", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setList(res.data);
  };
  useEffect(() => {
    load();
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    const [a, t] = await Promise.all([
      axios.get("http://localhost:4000/api/assets", {
        headers: { Authorization: `Bearer ${auth.token}` },
      }),
      axios.get("http://localhost:4000/api/technicians"),
    ]);
    setAssets(a.data);
    setTechs(t.data);
  };

  const submit = async () => {
    const fd = new FormData();
    Object.keys(form).forEach((k) => {
      const v = form[k];
      if (v !== "" && v !== undefined && v !== null) fd.append(k, v);
    });
    [...files].forEach((f) => fd.append("attachments", f));
    await axios.post("http://localhost:4000/api/workorders", fd, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    toast.push("Work order created", "success");
    setOpen(false);
    setForm({
      title: "",
      description: "",
      category: "Other",
      priority: "Low",
      asset: "",
      technician: "",
    });
    setFiles([]);
    load();
  };

  const startEdit = (wo) => {
    setEditWO(wo);
    setForm({
      title: wo.title,
      description: wo.description || "",
      category: wo.category,
      priority: wo.priority,
      asset: wo.asset?._id || "",
      technician: wo.technician?._id || "",
    });
    setEditFiles([]);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editWO) return;
    const fd = new FormData();
    if (auth.user?.role === "admin") {
      [
        "title",
        "description",
        "category",
        "priority",
        "asset",
        "technician",
      ].forEach((f) => fd.append(f, form[f]));
    } else {
      ["description"].forEach((f) => fd.append(f, form[f]));
    }
    [...editFiles].forEach((f) => fd.append("attachments", f));
    await axios.put(`http://localhost:4000/api/workorders/${editWO._id}`, fd, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    toast.push("Work order updated", "success");
    setEditOpen(false);
    setEditWO(null);
    setForm({
      title: "",
      description: "",
      category: "Other",
      priority: "Low",
      asset: "",
      technician: "",
    });
    load();
  };

  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });
  const deleteWO = async (wo) => {
    setConfirmDel({ open: true, id: wo._id });
  };
  const doDeleteWO = async () => {
    if (!confirmDel.id) return;
    await axios.delete(
      `http://localhost:4000/api/workorders/${confirmDel.id}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    toast.push("Work order deleted", "info");
    setConfirmDel({ open: false, id: null });
    load();
  };

  const [statusDlg, setStatusDlg] = useState({
    open: false,
    wo: null,
    choice: "Open",
    options: [],
  });
  const openStatus = (wo) => {
    if (auth.user?.role === "admin" && !wo.technician) {
      toast.push("Assign a technician before changing status", "warning");
      return;
    }
    const options =
      auth.user?.role === "admin"
        ? ["Open", "In Progress", "Completed", "Verified"]
        : ["Open", "In Progress", "Completed"];
    setStatusDlg({ open: true, wo, choice: wo.status, options });
  };
  const doChangeStatus = async () => {
    if (!statusDlg.wo) return;
    const status = statusDlg.choice;
    await axios.post(
      `http://localhost:4000/api/workorders/${statusDlg.wo._id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    toast.push(`Status -> ${status}`, "success");
    setStatusDlg({ open: false, wo: null, choice: "Open", options: [] });
    load();
  };

  const openNotes = (wo) => {
    setCurrentWO(wo);
    setNoteOpen(true);
  };
  const openHistory = (wo) => {
    setCurrentWO(wo);
    setHistoryOpen(true);
  };
  const addNote = async () => {
    if (!currentWO) return;
    await axios.post(
      `http://localhost:4000/api/workorders/${currentWO._id}/notes`,
      { text: noteText, author: auth.user?.name || "UI" },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    toast.push("Note added", "success");
    setNoteText("");
    setNoteOpen(false);
    load();
  };

  const [confirmRollback, setConfirmRollback] = useState({
    open: false,
    id: null,
  });
  const rollback = async (wo) => {
    setConfirmRollback({ open: true, id: wo._id });
  };
  const doRollback = async () => {
    if (!confirmRollback.id) return;
    await axios.post(
      `http://localhost:4000/api/workorders/${confirmRollback.id}/rollback`,
      {},
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    toast.push("Status rolled back", "info");
    setConfirmRollback({ open: false, id: null });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Work Orders</h2>
        {(auth.user?.role === "resident" || auth.user?.role === "admin") && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            New Work Order
          </Button>
        )}
      </div>
      <div className="grid gap-3">
        {list.map((w) => {
          return (
            <div key={w._id} className="bg-white rounded shadow p-3">
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="subtitle1">{w.title}</Typography>
                  <p className="text-xs text-gray-600">
                    {w.asset?.name || "No asset"} •{" "}
                    {w.technician?.name || "Unassigned"}
                  </p>
                </div>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={w.priority}
                    color={
                      w.priority === "Emergency"
                        ? "error"
                        : w.priority === "High"
                        ? "warning"
                        : "primary"
                    }
                    size="small"
                  />
                  {auth.user?.role === "admin" ||
                  auth.user?.role === "technician" ? (
                    <Chip
                      label={w.status}
                      size="small"
                      onClick={() => openStatus(w)}
                      clickable
                    />
                  ) : (
                    <Chip label={w.status} size="small" />
                  )}
                  {(auth.user?.role === "admin" ||
                    auth.user?.role === "technician") && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => startEdit(w)}
                    >
                      Edit
                    </Button>
                  )}
                  {auth.user?.role === "admin" && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteWO(w)}
                    >
                      Delete
                    </Button>
                  )}
                  {auth.user?.role === "admin" &&
                    w.statusHistory &&
                    w.statusHistory.length > 0 &&
                    w.status !== "Open" && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => rollback(w)}
                      >
                        Rollback
                      </Button>
                    )}
                </Stack>
              </div>
              <p className="text-sm text-gray-600 mt-1">{w.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openNotes(w)}
                >
                  Notes ({w.notes?.length || 0})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openHistory(w)}
                >
                  History ({w.statusHistory?.length || 0})
                </Button>
                {w.attachments &&
                  w.attachments.map((a) => (
                    <a
                      key={a}
                      href={a}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-xs"
                    >
                      Attachment
                    </a>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New Work Order</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            select
            label="Category"
            fullWidth
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Priority"
            fullWidth
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {priorities.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
          <FormControl fullWidth>
            <InputLabel id="asset-label">Asset</InputLabel>
            <Select
              labelId="asset-label"
              label="Asset"
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
            {auth.user?.role === "resident" && (
              <FormHelperText>
                Optional for residents (leave blank if unknown)
              </FormHelperText>
            )}
          </FormControl>
          {auth.user?.role === "admin" && (
            <FormControl fullWidth>
              <InputLabel id="tech-label">Technician</InputLabel>
              <Select
                labelId="tech-label"
                label="Technician"
                value={form.technician}
                onChange={(e) =>
                  setForm({ ...form, technician: e.target.value })
                }
              >
                {(form.category === "Other"
                  ? techs
                  : techs.filter((t) =>
                      (t.skills || []).includes(form.category)
                    )
                ).map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            type="file"
            inputProps={{ multiple: true }}
            onChange={(e) => setFiles(e.target.files)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Notes</DialogTitle>
        <DialogContent className="space-y-3">
          <div className="space-y-2 max-h-48 overflow-auto">
            {currentWO?.notes?.map((n, i) => (
              <div key={i} className="border rounded p-2">
                <p className="text-xs">{n.text}</p>
                <p className="text-[10px] text-gray-500">
                  {n.author} • {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {(!currentWO?.notes || currentWO.notes.length === 0) && (
              <p className="text-xs text-gray-500">No notes</p>
            )}
          </div>
          <TextField
            label="Add Note"
            fullWidth
            multiline
            minRows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={addNote}
            disabled={!noteText.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Status History</DialogTitle>
        <DialogContent>
          <div className="space-y-2 max-h-64 overflow-auto">
            {currentWO?.statusHistory && currentWO.statusHistory.length > 0 ? (
              currentWO.statusHistory.map((h, i) => (
                <div
                  key={i}
                  className="border rounded p-2 text-xs flex justify-between"
                >
                  <span>{new Date(h.at).toLocaleString()}</span>
                  <span>
                    {h.from} → {h.to}
                    {h.rollback ? " (rollback)" : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No history</p>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={statusDlg.open}
        onClose={() =>
          setStatusDlg({ open: false, wo: null, choice: "Open", options: [] })
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent className="space-y-3">
          <p className="text-sm">Current: {statusDlg.wo?.status}</p>
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              value={statusDlg.choice}
              onChange={(e) =>
                setStatusDlg((prev) => ({ ...prev, choice: e.target.value }))
              }
            >
              {statusDlg.options.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setStatusDlg({
                open: false,
                wo: null,
                choice: "Open",
                options: [],
              })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={doChangeStatus}
            disabled={
              !statusDlg.wo || statusDlg.choice === statusDlg.wo?.status
            }
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditWO(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Work Order</DialogTitle>
        <DialogContent className="space-y-4">
          {auth.user?.role === "admin" && (
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          )}
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {auth.user?.role === "admin" && (
            <>
              <TextField
                select
                label="Category"
                fullWidth
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Priority"
                fullWidth
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {priorities.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
              <FormControl fullWidth>
                <InputLabel id="asset-edit-label">Asset</InputLabel>
                <Select
                  labelId="asset-edit-label"
                  label="Asset"
                  value={form.asset}
                  onChange={(e) => setForm({ ...form, asset: e.target.value })}
                >
                  {filteredEditAssets.length === 0 && (
                    <MenuItem disabled>No assets found</MenuItem>
                  )}
                  {filteredEditAssets.map((a) => (
                    <MenuItem key={a._id} value={a._id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          {auth.user?.role === "admin" && (
            <FormControl fullWidth>
              <InputLabel id="tech-edit-label">Technician</InputLabel>
              <Select
                labelId="tech-edit-label"
                label="Technician"
                value={form.technician}
                onChange={(e) =>
                  setForm({
                    ...form,
                    technician: e.target.value,
                  })
                }
              >
                {(form.category === "Other"
                  ? techs
                  : techs.filter(
                      (t) =>
                        Array.isArray(t.skills) &&
                        t.skills.includes(form.category)
                    )
                ).map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            type="file"
            inputProps={{ multiple: true }}
            onChange={(e) => setEditFiles(e.target.files)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditOpen(false);
              setEditWO(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={submitEdit} disabled={!editWO}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDel.open}
        onClose={() => setConfirmDel({ open: false, id: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Work Order</DialogTitle>
        <DialogContent>
          <p className="text-sm">
            Delete this work order? This cannot be undone.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDel({ open: false, id: null })}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={doDeleteWO}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmRollback.open}
        onClose={() => setConfirmRollback({ open: false, id: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rollback Status</DialogTitle>
        <DialogContent>
          <p className="text-sm">Rollback status to previous state?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRollback({ open: false, id: null })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={doRollback}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
