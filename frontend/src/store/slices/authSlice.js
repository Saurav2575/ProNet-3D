import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services';
// Remove tokens from the earlier version; the session is now held in HTTP-only cookies.
localStorage.removeItem('token');localStorage.removeItem('user');
const request=(name,fn)=>createAsyncThunk(name,async(input,{rejectWithValue})=>{try{return (await fn(input)).data;}catch(err){return rejectWithValue(err.response?.data?.message||'Cannot reach the server. Please try again.');}});
export const loginUser=request('auth/login',authAPI.login);
export const registerUser=request('auth/register',authAPI.register);
export const logout=request('auth/logout',authAPI.logout);
export const fetchMe=createAsyncThunk('auth/fetchMe',async(_,{rejectWithValue})=>{try{return (await authAPI.getMe()).data;}catch(err){return rejectWithValue({status:err.response?.status,message:err.response?.data?.message||'Cannot reach the server. Check that the backend is running.'});}}, {condition:(_, {getState})=>!getState().auth.checking});
const slice=createSlice({name:'auth',initialState:{user:null,loading:false,error:null,initialized:false,checking:false,startupError:null},reducers:{clearError:state=>{state.error=null;},sessionExpired:state=>{state.user=null;state.initialized=true;}},extraReducers:builder=>{
  for(const thunk of [loginUser,registerUser]) builder.addCase(thunk.pending,state=>{state.loading=true;state.error=null;}).addCase(thunk.fulfilled,(state,action)=>{state.loading=false;state.user=action.payload;state.initialized=true;state.startupError=null;}).addCase(thunk.rejected,(state,action)=>{state.loading=false;state.error=action.payload;});
  builder.addCase(fetchMe.pending,state=>{state.checking=true;}).addCase(fetchMe.fulfilled,(state,action)=>{state.checking=false;state.initialized=true;state.user=action.payload;state.startupError=null;}).addCase(fetchMe.rejected,(state,action)=>{state.checking=false;state.initialized=true;if(action.payload?.status===401) state.user=null;else state.startupError=action.payload?.message;});
  builder.addCase(logout.fulfilled,state=>{state.user=null;state.initialized=true;}).addCase(logout.rejected,(state,action)=>{state.error=action.payload;});
}});
export const {clearError,sessionExpired}=slice.actions;export default slice.reducer;
