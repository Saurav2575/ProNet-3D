import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { Card,CardContent,Box,Typography,Dialog,DialogTitle,DialogContent,IconButton,Alert,Button,TextField } from '@mui/material';
import { X,Send,Image } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import GoButton from '../common/GoButton';
import ImageUpload from '../common/ImageUpload';
import { createPost } from '../../store/slices/feedSlice';
const PostShareBox=()=>{
  const dispatch=useDispatch();const {user}=useSelector(s=>s.auth);const {creating}=useSelector(s=>s.feed);
  const [open,setOpen]=useState(false),[content,setContent]=useState(''),[image,setImage]=useState(''),[error,setError]=useState('');
  const [params,setParams]=useSearchParams();
  useEffect(()=>{if(params.get('compose')==='1'){setOpen(true);setParams({}, {replace:true});}},[params,setParams]);
  const submit=async e=>{e.preventDefault();setError('');try{await dispatch(createPost({content:content.trim(),image})).unwrap();setContent('');setImage('');setOpen(false);}catch(err){setError(String(err));}};
  return <><Card id="composer" sx={{mb:2}}><CardContent><Box sx={{display:'flex',gap:1.5,alignItems:'center'}}><UserAvatar user={user} size={44}/><Button variant="outlined" fullWidth onClick={()=>setOpen(true)} sx={{justifyContent:'flex-start',borderColor:'divider',color:'text.secondary',bgcolor:'action.hover',fontWeight:500,borderRadius:2,fontSize:12,py:1.2}}>Start a post, {user?.firstName}...</Button></Box><Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid',borderColor:'divider',mt:2,pt:1}}><Button onClick={()=>setOpen(true)} startIcon={<Image size={16}/>} sx={{fontSize:11}}>Photo</Button><Typography sx={{fontSize:10,color:'text.secondary'}}>Share an idea, milestone, or question.</Typography></Box></CardContent></Card>
  <Dialog open={open} onClose={()=>!creating&&setOpen(false)} fullWidth maxWidth="sm"><DialogTitle sx={{display:'flex',justifyContent:'space-between'}}>Create a post<IconButton aria-label="Close post" onClick={()=>setOpen(false)}><X/></IconButton></DialogTitle><DialogContent><Box component="form" onSubmit={submit} sx={{pt:1}}>{error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}<TextField label="Post content" multiline rows={5} fullWidth required value={content} onChange={e=>setContent(e.target.value)} inputProps={{maxLength:3000}} helperText={`${content.length}/3000`}/><Box sx={{my:2}}><ImageUpload onUploaded={setImage}/>{image&&<><Box component="img" src={image} alt="Post attachment preview" sx={{maxWidth:'100%',maxHeight:220,display:'block',mt:1}}/><Button onClick={()=>setImage('')}>Remove image</Button></>}</Box><GoButton type="submit" loading={creating} disabled={!content.trim()} startIcon={<Send size={16}/>}>Post</GoButton></Box></DialogContent></Dialog></>;
};
export default PostShareBox;
