import AuthShell from '../components/auth/AuthShell';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Alert, IconButton, InputAdornment,
} from '@mui/material';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input';
import GoButton from '../components/common/GoButton';
import { loginUser, clearError } from '../store/slices/authSlice';
import tokens from '../assets/tokens';

const Login = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return <AuthShell title="Sign in to ProNet" subtitle="Your network and next opportunity are waiting." signup={false}>
<Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',bgcolor:'action.hover',borderRadius:2,p:.5,mb:3,fontSize:12,textAlign:'center'}}><Box sx={{bgcolor:'background.paper',borderRadius:1.5,py:1,fontWeight:700,boxShadow:'0 1px 4px rgba(10,37,64,.08)'}}>Sign In</Box><Box component={Link} to="/register" sx={{py:1,color:'text.secondary'}}>Create Account</Box></Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: tokens.radius.md }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Input
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            autoComplete="email"
          />
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <GoButton
            type="submit"
            fullWidth
            loading={loading}
            sx={{ mb: 2, py: 1.4 }}
            endIcon={<ArrowRight size={18} />}
          >
            Sign In
          </GoButton>
        </Box>


</AuthShell>;
};

export default Login;
