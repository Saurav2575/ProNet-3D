import { useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { Alert,Box,Button,CircularProgress } from '@mui/material';
import AppRoutes from './routes/AppRoutes';
import { fetchMe,sessionExpired } from './store/slices/authSlice';
const App=()=>{
  const dispatch=useDispatch();const {initialized,startupError}=useSelector(s=>s.auth);
  useEffect(()=>{dispatch(fetchMe());const expire=()=>dispatch(sessionExpired());window.addEventListener('auth:expired',expire);return()=>window.removeEventListener('auth:expired',expire);},[dispatch]);
  if(!initialized) return <Box sx={{display:'grid',placeItems:'center',minHeight:'100vh'}}><CircularProgress aria-label="Loading session" /></Box>;
  return <>{startupError&&<Alert severity="warning" action={<Button onClick={()=>dispatch(fetchMe())}>Retry</Button>}>{startupError}</Alert>}<AppRoutes /></>;
};
export default App;
