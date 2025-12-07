import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

export default function Notifications(){
  const [list,setList]=useState([]);
  const auth = useAuth();
  const toast = useToast();
  const load = async () => {
    const r = await axios.get('https://my-backend-r5al.onrender.com/api/notifications', { headers:{ Authorization:`Bearer ${auth.token}` }});
    setList(r.data);
  };
  useEffect(()=>{ load(); },[]);
  const markRead = async (id) => {
    await axios.post(`https://my-backend-r5al.onrender.com/api/notifications/${id}/read`, {}, { headers:{ Authorization:`Bearer ${auth.token}` }});
    toast.push('Marked as read','success');
    load();
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </div>
      <div className="space-y-2">
        {list.map(n => (
          <div key={n._id} className={`bg-white rounded shadow p-3 ${n.read? 'opacity-70':''}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm">{n.message}</p>
                <p className="text-[10px] text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && <Button size="small" onClick={()=>markRead(n._id)}>Mark read</Button>}
            </div>
          </div>
        ))}
        {list.length===0 && <p className="text-sm text-gray-600">No notifications</p>}
      </div>
    </div>
  );
}
