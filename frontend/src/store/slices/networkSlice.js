import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import { connectionAPI,userAPI } from '../../services';
export const fetchNetwork=createAsyncThunk('network/fetch',async(_,{rejectWithValue})=>{
  try{const [connections,pending,suggestions]=await Promise.all([connectionAPI.getAll(),connectionAPI.getPending(),userAPI.getSuggestions()]);return {connections:connections.data,pending:pending.data,suggestions:suggestions.data};}catch(err){return rejectWithValue(err.response?.data?.message||'Could not load your network.');}
},{condition:(force,{getState})=>{const s=getState().network;return !s.loading&&(force||!s.loadedAt||Date.now()-s.loadedAt>30000);}});
const slice=createSlice({name:'network',initialState:{connections:[],pending:[],suggestions:[],loading:false,error:null,loadedAt:0},reducers:{},extraReducers:b=>b.addCase(fetchNetwork.pending,s=>{s.loading=true;s.error=null;}).addCase(fetchNetwork.fulfilled,(s,a)=>{Object.assign(s,a.payload,{loading:false,loadedAt:Date.now()});}).addCase(fetchNetwork.rejected,(s,a)=>{s.loading=false;s.error=a.payload;})});
export default slice.reducer;
