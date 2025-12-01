import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Paper, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', { email, password });
      auth.login(res.data.token, res.data.user);
      toast.push('Logged in','success');
      navigate('/work-orders');
    } catch (e) {
      toast.push('Login failed','error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Paper className="p-6 w-full max-w-sm space-y-4">
        <Typography variant="h6">Login</Typography>
        <form onSubmit={submit} className="space-y-3">
          <TextField label="Email" type="email" fullWidth value={email} onChange={e=>setEmail(e.target.value)} />
          <TextField label="Password" type="password" fullWidth value={password} onChange={e=>setPassword(e.target.value)} />
          <Button variant="contained" type="submit" fullWidth disabled={!email || !password}>Login</Button>
        </form>
      </Paper>
    </div>
  );
}
