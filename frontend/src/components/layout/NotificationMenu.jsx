import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge,IconButton,Menu,MenuItem,Typography,Box,Button,Alert,Divider } from '@mui/material';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../../services';
const NotificationMenu=()=>{
  const [anchor,setAnchor]=useState(null),[items,setItems]=useState([]),[unread,setUnread]=useState(0),[error,setError]=useState('');const navigate=useNavigate();
  const load=async()=>{try{const {data}=await notificationAPI.getAll();setItems(data.items);setUnread(data.unread);setError('');}catch(err){setError(err.response?.data?.message||'Could not load notifications.');}};
  useEffect(()=>{load();const id=setInterval(load,30000);return()=>clearInterval(id);},[]);
  const read=async item=>{try{await notificationAPI.read(item._id);setAnchor(null);navigate(item.link);load();}catch{setError('Could not mark this notification read.');}};
  const readAll=async()=>{try{await notificationAPI.readAll();load();}catch{setError('Could not mark notifications read.');}};
  return <><IconButton aria-label="Notifications" onClick={e=>{setAnchor(e.currentTarget);load();}} sx={{color:'text.secondary'}}><Badge badgeContent={unread} color="error"><Bell size={20}/></Badge></IconButton><Menu anchorEl={anchor} open={!!anchor} onClose={()=>setAnchor(null)} anchorOrigin={{vertical:'bottom',horizontal:'right'}} transformOrigin={{vertical:'top',horizontal:'right'}} slotProps={{paper:{sx:{width:360,maxWidth:'calc(100vw - 24px)',maxHeight:450,bgcolor:'background.paper',color:'text.primary'}}}}><Box sx={{px:2,py:1}}><Typography variant="h6">Notifications</Typography><Button size="small" disabled={!unread} onClick={readAll}>Mark all read</Button></Box><Divider/>{error&&<Alert severity="error">{error}</Alert>}{!items.length&&<MenuItem disabled>No notifications yet</MenuItem>}{items.map(item=><MenuItem key={item._id} onClick={()=>read(item)} sx={{whiteSpace:'normal',py:1.5,bgcolor:item.read?'transparent':'action.selected'}}><Typography variant="body2">{item.message}</Typography></MenuItem>)}</Menu></>;
};
export default NotificationMenu;
