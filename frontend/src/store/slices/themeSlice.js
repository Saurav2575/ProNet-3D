import { createSlice } from '@reduxjs/toolkit';
const stored=localStorage.getItem('theme');
const slice=createSlice({name:'theme',initialState:{mode:stored==='dark'?'dark':'light'},reducers:{toggleTheme:state=>{state.mode=state.mode==='light'?'dark':'light';},setTheme:(state,action)=>{state.mode=action.payload==='dark'?'dark':'light';}}});
export const {toggleTheme,setTheme}=slice.actions;export default slice.reducer;
