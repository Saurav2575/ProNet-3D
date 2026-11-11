import { useState } from 'react';
import { Alert,Box,Button,CircularProgress } from '@mui/material';
import { uploadAPI } from '../../services';
const ImageUpload=({label='Upload image',folder='posts',onUploaded})=>{
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const upload=async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file) return;
    if(file.size>5*1024*1024){setError('Choose an image smaller than 5 MB.');return;}
    setBusy(true);setError('');
    try{const {data}=await uploadAPI.image(file,folder);await onUploaded(data.url);}catch(err){setError(err.response?.data?.message||'Could not upload this image. Please try again.');}finally{setBusy(false);}
  };
  return <Box>{error&&<Alert severity="error" sx={{mb:1}}>{error}</Alert>}<Button component="label" variant="outlined" disabled={busy} startIcon={busy?<CircularProgress size={16}/>:undefined}>{label}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={upload}/></Button></Box>;
};
export default ImageUpload;
