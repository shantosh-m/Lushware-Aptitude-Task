import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

export default function Technicians(){
  const [list,setList]=useState([]); const [open,setOpen]=useState(false); const [form,setForm]=useState({ name:'', email:'', phone:'', skills:[] });
  const auth = useAuth();
  const toast = useToast();
  const load=async()=>{ const r=await axios.get('http://localhost:4000/api/technicians'); setList(r.data); };
  useEffect(()=>{ load(); },[]);
  const submit=async()=>{ await axios.post('http://localhost:4000/api/technicians', { ...form, skills: form.skills }, { headers:{ Authorization:`Bearer ${auth.token}` }}); setOpen(false); setForm({ name:'', email:'', phone:'', skills:[]}); load(); toast.push('Technician created','success'); };
  const [edit,setEdit]=useState(null);
  const [confirmDel,setConfirmDel]=useState({ open:false, id:null });
  const startEdit=(tech)=>{ setEdit(tech); setForm({ name:tech.name||'', email:tech.email||'', phone:tech.phone||'', skills:(tech.skills||[]) }); setOpen(true); };
  const update=async()=>{ if(!edit) return; await axios.put(`http://localhost:4000/api/technicians/${edit._id}`, { ...form, skills: form.skills }, { headers:{ Authorization:`Bearer ${auth.token}` }}); setOpen(false); setEdit(null); setForm({ name:'', email:'', phone:'', skills:''}); load(); toast.push('Technician updated','success'); };
  const remove=async(id)=>{ setConfirmDel({ open:true, id }); };
  const skills = ["HVAC", "Electrical", "Plumbing", "Fire Safety"];
  const doRemove=async()=>{
    if (!confirmDel.id) return;
    await axios.delete(`http://localhost:4000/api/technicians/${confirmDel.id}`, { headers:{ Authorization:`Bearer ${auth.token}` }});
    setConfirmDel({ open:false, id:null });
    load(); toast.push('Technician deleted','info');
  };
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Technicians</h2>
        {auth.user?.role === 'admin' && (
          <Button variant="contained" onClick={()=>setOpen(true)}>New Technician</Button>
        )}
      </div>
      <div className="grid gap-3">
        {list.map(t=> (
          <div key={t._id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-gray-600">{t.email}</p>
                {t.skills && t.skills.length>0 && <p className="text-xs">Skills: {t.skills.join(', ')}</p>}
              </div>
              {auth.user?.role==='admin' && (
                <div className="flex gap-2">
                  <Button size="small" variant="outlined" onClick={()=>startEdit(t)}>Edit</Button>
                  <Button size="small" color="error" variant="contained" onClick={()=>remove(t._id)}>Delete</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit? 'Edit Technician':'New Technician'}</DialogTitle>
        <DialogContent className="space-y-3">
          <TextField label="Name" fullWidth value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <TextField label="Email" fullWidth value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          <TextField label="Phone" fullWidth value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
          <TextField
            select
            label="Skills"
            fullWidth
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            SelectProps={{ multiple: true }}
          >
            {skills.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          {edit ? (
            <Button variant="contained" onClick={update}>Save</Button>
          ) : (
            <Button variant="contained" onClick={submit}>Create</Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={confirmDel.open} onClose={()=>setConfirmDel({ open:false, id:null })} fullWidth maxWidth="xs">
        <DialogTitle>Delete Technician</DialogTitle>
        <DialogContent>
          <p className="text-sm">Delete this technician? This cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirmDel({ open:false, id:null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doRemove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
