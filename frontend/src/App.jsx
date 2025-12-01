import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import WorkOrders from './pages/WorkOrders'
import PreventiveMaintenance from './pages/PreventiveMaintenance'
import Assets from './pages/Assets'
import Technicians from './pages/Technicians'
import CalendarView from './pages/CalendarView'
import Notifications from './pages/Notifications'
import Login from './pages/Login'
import { ToastProvider } from './components/ToastProvider'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppBar, Toolbar, Typography, Button } from '@mui/material'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/" element={<RequireAuth><WorkOrders/></RequireAuth>} />
      <Route path="/work-orders" element={<RequireAuth><WorkOrders/></RequireAuth>} />
      <Route path="/pm" element={<RequireAuth><PreventiveMaintenance/></RequireAuth>} />
      <Route path="/assets" element={<RequireAuth><Assets/></RequireAuth>} />
      <Route path="/technicians" element={<RequireAuth><Technicians/></RequireAuth>} />
      <Route path="/calendar" element={<RequireAuth><CalendarView/></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Notifications/></RequireAuth>} />
    </Routes>
  );
}

function AuthNav(){
  const { isAuthenticated, user, logout } = useAuth();
  if (!isAuthenticated) return <Button color="inherit" component={Link} to="/login">Login</Button>;
  const role = user?.role;
  const can = {
    workOrders: true,
    pm: role === 'admin' || role === 'technician',
    assets: role === 'admin' || role === 'technician', 
    technicians: role === 'admin',
    calendar: role === 'admin' || role === 'technician'
  };
  return (
    <>
      <Button color="inherit" component={Link} to="/notifications">Notifications</Button>
      {can.workOrders && <Button color="inherit" component={Link} to="/work-orders">Work Orders</Button>}
      {can.pm && <Button color="inherit" component={Link} to="/pm">Preventive</Button>}
      {can.assets && <Button color="inherit" component={Link} to="/assets">Assets</Button>}
      {can.technicians && <Button color="inherit" component={Link} to="/technicians">Technicians</Button>}
      {can.calendar && <Button color="inherit" component={Link} to="/calendar">Calendar</Button>}
      <Button color="inherit" onClick={logout}>Logout ({user?.name})</Button>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" sx={{ flex: 1 }}>CMMS</Typography>
              <AuthNav />
            </Toolbar>
          </AppBar>
          <main className="p-4">
            <AppRoutes />
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
