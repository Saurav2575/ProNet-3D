import { Box, Typography, CircularProgress } from '@mui/material';
import tokens from '../../assets/tokens';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 7,
      px: 3,
      bgcolor: 'background.paper',
      borderRadius: tokens.radius.lg,
      border: `1px solid ${tokens.border}`,
      animation: 'fadeInUp 0.4s ease',
    }}
  >
    {/* SVG illustration wrapper */}
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: tokens.gradient.card,
        border: `2px dashed ${tokens.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 2.5,
        color: tokens.primary,
        animation: 'float 3s ease-in-out infinite',
      }}
    >
      {Icon && <Icon size={32} strokeWidth={1.5} />}
    </Box>
    <Typography
      variant="h6"
      sx={{ color: 'text.primary', mb: 1, fontWeight: 700 }}
    >
      {title}
    </Typography>
    {description && (
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mb: action ? 3 : 0, maxWidth: 300, mx: 'auto' }}
      >
        {description}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);

export const LoadingState = ({ rows = 3 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Box
        key={i}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.border}`,
          p: 2.5,
          animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
        }}
      >
        {/* Header row */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Box
            className="shimmer-bg"
            sx={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box className="shimmer-bg" sx={{ height: 14, width: '55%', borderRadius: 2, mb: 1 }} />
            <Box className="shimmer-bg" sx={{ height: 11, width: '35%', borderRadius: 2 }} />
          </Box>
        </Box>
        {/* Content rows */}
        <Box className="shimmer-bg" sx={{ height: 12, width: '100%', borderRadius: 2, mb: 1.5 }} />
        <Box className="shimmer-bg" sx={{ height: 12, width: '88%', borderRadius: 2, mb: 1.5 }} />
        <Box className="shimmer-bg" sx={{ height: 12, width: '70%', borderRadius: 2, mb: 2 }} />
        {/* Action row */}
        <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: `1px solid ${tokens.border}` }}>
          <Box className="shimmer-bg" sx={{ height: 28, width: 70, borderRadius: 6 }} />
          <Box className="shimmer-bg" sx={{ height: 28, width: 70, borderRadius: 6 }} />
        </Box>
      </Box>
    ))}
  </Box>
);

export const InlineLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
    <CircularProgress
      size={36}
      thickness={4}
      sx={{
        color: tokens.primary,
        '& .MuiCircularProgress-circle': {
          strokeLinecap: 'round',
        },
      }}
    />
  </Box>
);

export default EmptyState;
