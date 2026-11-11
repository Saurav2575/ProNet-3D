import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import { jobAPI } from '../../services';
export const fetchJobs=createAsyncThunk('jobs/fetch',async(params,{rejectWithValue})=>{try{const [jobs,applications,myJobs]=await Promise.all([jobAPI.getAll(params),jobAPI.myApplications(),jobAPI.myJobs()]);return {jobs:jobs.data,applications:applications.data,myJobs:myJobs.data};}catch(err){return rejectWithValue(err.response?.data?.message||'Could not load jobs.');}});
const slice=createSlice({name:'jobs',initialState:{jobs:[],applications:[],myJobs:[],loading:false,error:null},reducers:{},extraReducers:b=>b.addCase(fetchJobs.pending,s=>{s.loading=true;s.error=null;}).addCase(fetchJobs.fulfilled,(s,a)=>{Object.assign(s,a.payload,{loading:false});}).addCase(fetchJobs.rejected,(s,a)=>{s.loading=false;s.error=a.payload;})});
export default slice.reducer;
