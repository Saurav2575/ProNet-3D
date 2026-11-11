import { TextField } from '@mui/material';
import tokens from '../../assets/tokens';

const Input = ({ label, error, helperText, sx = {}, ...props }) => (
  <TextField
    label={label}
    error={!!error}
    helperText={typeof error === 'string' ? error : helperText}
    fullWidth
    variant="outlined"
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: tokens.radius.md,
        transition: 'box-shadow 0.2s ease',
        '&.Mui-focused': {
          boxShadow: `0 0 0 3px rgba(0, 102, 255, 0.12)`,
        },
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: tokens.primary,
      },
      ...sx,
    }}
    {...props}
  />
);

export default Input;
