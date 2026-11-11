import { Box, Typography } from '@mui/material';
const Logo = ({ size = 'md', inverse = false }) => {
  const dimensions = size === 'lg' ? 42 : size === 'sm' ? 32 : 35;
  return <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1, whiteSpace: 'nowrap' }}>
    <Box sx={{ width: dimensions, height: dimensions, borderRadius: '9px', display: 'grid', placeItems: 'center', bgcolor: inverse ? 'rgba(255,255,255,.1)' : '#0A2540', border: inverse ? '1px solid rgba(255,255,255,.2)' : 'none', color: '#fff', fontWeight: 850, fontSize: dimensions * .52 }}>P</Box>
    <Typography sx={{ fontWeight: 800, fontSize: size === 'lg' ? 27 : 23, letterSpacing: '-.05em', color: inverse ? '#fff' : 'text.primary' }}>Pro<Box component="span" sx={{ color: inverse ? '#00D4B2' : '#0066FF' }}>Net</Box></Typography>
  </Box>;
};
export default Logo;
