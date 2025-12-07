import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";

export default function Assets() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    location: "",
    serial: "",
    details: "",
  });
  const auth = useAuth();
  const toast = useToast();
  const categories = ["HVAC", "Electrical", "Plumbing", "Fire Safety", "Other"];
  const load = async () => {
    const r = await axios.get("https://my-backend-r5al.onrender.com/api/assets", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setList(r.data);
  };
  useEffect(() => {
    load();
  }, []);
  const submit = async () => {
    await axios.post("https://my-backend-r5al.onrender.com/api/assets", form, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setOpen(false);
    setForm({ name: "", category: "", location: "", serial: "", details: "" });
    load();
    toast.push("Asset created", "success");
  };
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null });
  const startEdit = (asset) => {
    setEdit(asset);
    setForm({
      name: asset.name || "",
      category: asset.category || "",
      location: asset.location || "",
      serial: asset.serial || "",
      details: asset.details || "",
    });
    setOpen(true);
  };
  const update = async () => {
    if (!edit) return;
    await axios.put(`https://my-backend-r5al.onrender.com/api/assets/${edit._id}`, form, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setOpen(false);
    setEdit(null);
    setForm({ name: "", category: "", location: "", serial: "", details: "" });
    load();
    toast.push("Asset updated", "success");
  };
  const remove = async (id) => {
    setConfirmDel({ open: true, id });
  };
  const doRemove = async () => {
    if (!confirmDel.id) return;
    await axios.delete(`https://my-backend-r5al.onrender.com/api/assets/${confirmDel.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setConfirmDel({ open: false, id: null });
    load();
    toast.push("Asset deleted", "info");
  };
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Assets</h2>
        {auth.user?.role === "admin" && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            New Asset
          </Button>
        )}
      </div>
      <div className="grid gap-3">
        {list.map((a) => (
          <div key={a._id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-gray-600">
                  {a.category} • {a.location}
                </p>
                {a.serial && <p className="text-xs">Serial: {a.serial}</p>}
                {a.details && <p className="text-xs mt-1">{a.details}</p>}
              </div>
              {auth.user?.role === "admin" && (
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => startEdit(a)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={() => remove(a._id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{edit ? "Edit Asset" : "New Asset"}</DialogTitle>
        <DialogContent className="space-y-3">
          <TextField
            label="Name"
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            label="Location"
            fullWidth
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <TextField
            label="Serial"
            fullWidth
            value={form.serial}
            onChange={(e) => setForm({ ...form, serial: e.target.value })}
          />
          <TextField
            label="Details"
            fullWidth
            multiline
            minRows={2}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          {edit ? (
            <Button variant="contained" onClick={update}>
              Save
            </Button>
          ) : (
            <Button variant="contained" onClick={submit}>
              Create
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDel.open}
        onClose={() => setConfirmDel({ open: false, id: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <p className="text-sm">Delete this asset? This cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDel({ open: false, id: null })}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={doRemove}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
