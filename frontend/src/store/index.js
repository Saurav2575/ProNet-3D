import { configureStore,combineReducers } from '@reduxjs/toolkit';
import auth from './slices/authSlice';
import feed from './slices/feedSlice';
import network from './slices/networkSlice';
import jobs from './slices/jobsSlice';
import theme from './slices/themeSlice';
const combined=combineReducers({auth,feed,network,jobs,theme});
const reducer=(state,action)=>{
  if(['auth/logout/fulfilled','auth/sessionExpired'].includes(action.type)) state={theme:state?.theme,auth:{...state?.auth,user:null,initialized:true}};
  return combined(state,action);
};
export default configureStore({reducer});
