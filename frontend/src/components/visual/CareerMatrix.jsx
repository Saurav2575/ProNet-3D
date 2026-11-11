import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, Card, Typography, Button, ToggleButton, ToggleButtonGroup, useMediaQuery } from '@mui/material';
import { ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import CareerConstellation from './CareerConstellation';
const CareerMatrix = ({ compact = false }) => {
  const { user } = useSelector(s => s.auth); const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [mode, setMode] = useState('Synapse'), [paused, setPaused] = useState(false), [resetKey, setResetKey] = useState(0);
  const small = useMediaQuery('(max-width:600px)');
  return <Card sx={{ overflow: 'hidden', mb: 2 }}>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 2, py: 1.5 }}>
      <Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#00D4B2' }} /><Typography component="h2" sx={{ fontSize: 14, fontWeight: 750 }}>Holographic Career Matrix</Typography><Box sx={{ fontSize: 9, fontWeight: 800, px: .7, py: .3, bgcolor: 'action.hover', color: 'primary.main', borderRadius: 1 }}>3D</Box></Box><Typography sx={{ fontSize: 10, color: 'text.secondary', mt: .5 }}>{user?.connectionCount || 0} {user?.connectionCount === 1 ? 'connection' : 'connections'} in your network · a constellation of possibilities</Typography></Box>
      <ToggleButtonGroup value={mode} exclusive onChange={(_, value) => value && setMode(value)} aria-label="Matrix display mode" size="small" sx={{ bgcolor: 'action.hover', borderRadius: 2, p: .3, '& .MuiToggleButton-root': { border: 0, borderRadius: '6px !important', px: 1.1, py: .5, fontSize: 10, fontWeight: 700, textTransform: 'none', color: 'text.secondary', '&.Mui-selected': { bgcolor: 'background.paper', color: 'text.primary', boxShadow: '0 1px 4px rgba(10,37,64,.1)' } } }}>{['Synapse', 'Orbit', 'Density'].map(value => <ToggleButton key={value} value={value} aria-label={`${value} display`} aria-pressed={mode === value}>{value}</ToggleButton>)}</ToggleButtonGroup>
    </Box>
    <CareerConstellation key={`${mode}-${resetKey}`} mode={mode} paused={paused || reduced} height={compact ? 220 : small ? 260 : 310} />
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, py: 1.1, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: .5 }}><Button size="small" disabled={reduced} aria-label={paused || reduced ? 'Resume constellation motion' : 'Pause constellation motion'} onClick={() => setPaused(value => !value)} startIcon={paused || reduced ? <Play size={12} /> : <Pause size={12} />} sx={{ fontSize: 10, color: 'text.secondary', minWidth: 0, px: .7 }}>{reduced ? 'Reduced motion' : paused ? 'Resume' : 'Pause'}</Button><Button size="small" aria-label="Reset constellation view" onClick={() => setResetKey(value => value + 1)} startIcon={<RotateCcw size={12} />} sx={{ fontSize: 10, color: 'text.secondary', minWidth: 0, px: .7 }}>Reset</Button></Box>
      {!compact && <Button component={Link} to="/network" endIcon={<ArrowUpRight size={13} />} sx={{ fontSize: 10, bgcolor: '#0A2540', color: '#fff', px: 1.5, '&:hover': { bgcolor: '#123F68' } }}>Explore your network</Button>}
    </Box>
  </Card>;
};
export default CareerMatrix;
