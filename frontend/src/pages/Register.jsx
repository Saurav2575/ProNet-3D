import AuthShell from '../components/auth/AuthShell';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Alert, Grid, IconButton,
  InputAdornment,
} from '@mui/material';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input';
import GoButton from '../components/common/GoButton';
import { registerUser, clearError } from '../store/slices/authSlice';
import tokens from '../assets/tokens';

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const strengthLabels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const strengthColors = ['', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#059669'];

const StrengthBar = ({ password }) => {
  if (!password) return null;
  const s = getPasswordStrength(password);
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              bgcolor: i <= s ? strengthColors[s] : 'divider',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: strengthColors[s] || 'text.secondary', fontWeight: 600 }}>
        {strengthLabels[s]}
      </Typography>
    </Box>
  );
};

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setLocalError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (getPasswordStrength(form.password) < 2) {
      setLocalError('Please choose a stronger password');
      return;
    }
    const { confirmPassword, ...data } = form;
    dispatch(registerUser(data));
  };

  const displayError = localError || error;

  return <AuthShell title="Create your account" subtitle="Start with the essentials. Make your profile your own." signup={true}>

        {displayError && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: tokens.radius.md }}>
            {displayError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Input
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </Grid>
            <Grid item xs={6}>
              <Input
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
            </Grid>
          </Grid>

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
            sx={{ mb: 0.5 }}
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <StrengthBar password={form.password} />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            required
            sx={{ mt: 2, mb: 3 }}
            autoComplete="new-password"
            error={!!localError && localError.includes('match')}
          />

          <GoButton
            type="submit"
            fullWidth
            loading={loading}
            sx={{ mb: 2, py: 1.4 }}
            endIcon={<ArrowRight size={18} />}
          >
            Create Free Account
          </GoButton>
        </Box>


</AuthShell>;
};

export default Register;
