import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Toolbar, Button, Typography, IconButton, Menu, MenuItem, Badge } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    socket.on('incidentAlert', (alert) => setAlerts(prev => [...prev, alert.description]));
  }, [user]);

  const handleBellClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>MetaSafe Guardian</Typography>
        {user && (
          <>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            {(user.role === 'moderator' || user.role === 'admin') && <Button color="inherit" component={Link} to="/users">User Management</Button>}
            <Button color="inherit" component={Link} to="/analytics">Analytics</Button>
            {(user.role === 'moderator' || user.role === 'admin') && <Button color="inherit" component={Link} to="/zones">Safe Zones</Button>}
            <Button color="inherit" component={Link} to="/voice">Voice Analysis</Button>
            <IconButton color="inherit" onClick={handleBellClick}>
              <Badge badgeContent={alerts.length} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              {alerts.map((alert, idx) => (
                <MenuItem key={idx}>{alert}</MenuItem>
              ))}
            </Menu>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;