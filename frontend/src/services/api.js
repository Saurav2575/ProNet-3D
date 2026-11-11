import axios from 'axios';
const baseURL=import.meta.env.VITE_API_URL||'/api';
const api=axios.create({baseURL,withCredentials:true});
const sessionAPI=axios.create({baseURL,withCredentials:true});
let refreshPromise;
api.interceptors.response.use(response=>response,async error=>{
  const config=error.config;
  if(error.response?.status===401&&config&&!config._retried&&!/\/auth\/(login|register|refresh|logout)/.test(config.url)){
    config._retried=true;
    try{
      if(!refreshPromise) refreshPromise=sessionAPI.post('/auth/refresh').finally(()=>{refreshPromise=null;});
      await refreshPromise;
      return api(config);
    }catch(refreshError){
      if(refreshError.response?.status===401) window.dispatchEvent(new Event('auth:expired'));
    }
  }
  return Promise.reject(error);
});
export default api;
