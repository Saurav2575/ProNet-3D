import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppBar, Toolbar, Box, Button, IconButton, InputBase, Menu, MenuItem, BottomNavigation, BottomNavigationAction, Paper, Tooltip, Divider, Typography } from '@mui/material';
import { Search, Home, Users, Briefcase, User, LogOut, Sun, Moon, Settings, Plus } from 'lucide-react';
import Logo from '../common/Logo';
import UserAvatar from '../common/UserAvatar';
import NotificationMenu from './NotificationMenu';
import { logout } from '../../store/slices/authSlice';
import { useThemeMode } from '../../context/ThemeContext';
const navItems = [{ label: 'Feed', path: '/feed', icon: Home }, { label: 'Network', path: '/network', icon: Users }, { label: 'Jobs', path: '/jobs', icon: Briefcase }, { label: 'Profile', path: '/profile', icon: User }];
const Navbar = () => {
  const navigate = useNavigate(), location = useLocation(), dispatch = useDispatch();
  const { user } = useSelector(s => s.auth); const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null), [query, setQuery] = useState('');
  const destination = path => path === '/profile' ? `/profile/${user?._id}` : path;
  const handleLogout = async () => { try { await dispatch(logout()).unwrap(); navigate('/login'); } catch { /* Auth slice retains the API error. */ } finally { setAnchorEl(null); } };
  return <>
    <AppBar position="sticky" elevation={0} sx={{ color: 'text.primary', bgcolor: mode === 'light' ? 'rgba(255,255,255,.94)' : 'rgba(16,42,64,.94)', borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(16px)' }}>
      <Toolbar sx={{ minHeight: { xs: 60, md: 68 }, maxWidth: 1240, width: '100%', mx: 'auto', px: { xs: 1.5, sm: 3 }, gap: { xs: 1, md: 2.5 } }}>
        <Box component={Link} to="/feed" aria-label="ProNet home" sx={{ flexShrink: 0 }}><Logo size="sm" /></Box>
        <Box component="form" onSubmit={e => { e.preventDefault(); if (query.trim()) navigate(`/network?q=${encodeURIComponent(query.trim())}`); }} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, bgcolor: 'action.hover', borderRadius: 2, px: 1.5, py: .8, minWidth: 150, flex: 1, maxWidth: 250 }}><Search size={17} /><InputBase placeholder="Search professionals..." inputProps={{ 'aria-label': 'Search professionals' }} value={query} onChange={e => setQuery(e.target.value)} sx={{ minWidth: 0, flex: 1, fontSize: 12 }} /></Box>
        <Box sx={{ flex: { xs: 1, md: 0 } }} />
        <Box component="nav" aria-label="Primary navigation" sx={{ display: { xs: 'none', md: 'flex' }, ml: 'auto', gap: .25 }}>{navItems.map(({ label, path, icon: Icon }) => <Button key={path} component={Link} to={destination(path)} aria-current={location.pathname.startsWith(path) ? 'page' : undefined} startIcon={<Icon size={17} />} sx={{ minWidth: 0, px: 1.15, fontSize: 12, color: location.pathname.startsWith(path) ? 'primary.main' : 'text.secondary', bgcolor: location.pathname.startsWith(path) ? 'action.hover' : 'transparent', '& .MuiButton-startIcon': { mr: .6 } }}>{label}</Button>)}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: .4 }}>
          <NotificationMenu />
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}><IconButton aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`} size="small" onClick={toggleMode}>{mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}</IconButton></Tooltip>
          <Button component={Link} to="/feed?compose=1" variant="contained" startIcon={<Plus size={15} />} sx={{ display: { xs: 'none', lg: 'inline-flex' }, minWidth: 0, px: 1.5, fontSize: 12, ml: .5 }}>Post</Button>
          <IconButton aria-label="Account" onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: .4, ml: .5 }}><UserAvatar user={user} size={32} /></IconButton>
        </Box>
      </Toolbar>
    </AppBar>
    <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1, width: 235, border: '1px solid', borderColor: 'divider' } }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
      <Box sx={{ p: 2 }}><Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography><Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{user?.email}</Typography></Box><Divider />
      <MenuItem onClick={() => { navigate(`/profile/${user?._id}`); setAnchorEl(null); }} sx={{ gap: 1.5 }}><User size={16} />View Profile</MenuItem><MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ gap: 1.5 }}><Settings size={16} />Settings</MenuItem><Divider /><MenuItem onClick={handleLogout} sx={{ gap: 1.5, color: 'error.main' }}><LogOut size={16} />Sign Out</MenuItem>
    </Menu>
    <Paper component="nav" aria-label="Mobile navigation" elevation={0} sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', left: 12, right: 12, bottom: 'max(12px, env(safe-area-inset-bottom))', border: '1px solid', borderColor: 'divider', zIndex: 1100, boxShadow: '0 5px 25px rgba(10,37,64,.15)', overflow: 'hidden' }}><BottomNavigation showLabels value={navItems.findIndex(i => location.pathname.startsWith(i.path))} sx={{ height: 62, bgcolor: 'background.paper' }}>{navItems.map(({ label, path, icon: Icon }) => <BottomNavigationAction key={path} label={label} icon={<Icon size={19} />} onClick={() => navigate(destination(path))} sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: '10px !important' } }} />)}</BottomNavigation></Paper>
  </>;
};
export default Navbar;
