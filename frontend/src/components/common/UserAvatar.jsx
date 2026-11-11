import { Avatar, Box } from '@mui/material';
import tokens from '../../assets/tokens';
import { getInitials } from '../../utils/helpers';

// Generate a deterministic gradient from a user's name
const getAvatarGradient = (name = '') => {
  const gradients = [
    'linear-gradient(135deg, #0A2540, #17619A)',
    'linear-gradient(135deg, #0066FF, #28A6DF)',
    'linear-gradient(135deg, #008B77, #19B7A0)',
    'linear-gradient(135deg, #2A4F73, #6483A2)',
    'linear-gradient(135deg, #16618A, #1688AE)',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx] || gradients[0];
};

const UserAvatar = ({ user, size = 40, online = false, sx = {} }) => {
  const name = user?.firstName ? getInitials(user.firstName, user.lastName) : '?';
  const gradient = getAvatarGradient(user?.firstName || '');

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0, borderRadius: '50%', ...sx }}>
      <Avatar
        src={user?.avatar || undefined}
        alt={user?.firstName || 'User'}
        sx={{
          width: size,
          height: size,
          background: !user?.avatar ? gradient : undefined,
          fontSize: size * 0.38,
          fontWeight: 700,
          letterSpacing: '0.02em',
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: tokens.shadow.sm,
        }}
      >
        {!user?.avatar && name}
      </Avatar>
      {online && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: Math.max(10, size * 0.22),
            height: Math.max(10, size * 0.22),
            bgcolor: tokens.success,
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'pulse-ring 2s infinite',
          }}
        />
      )}
    </Box>
  );
};

export default UserAvatar;
