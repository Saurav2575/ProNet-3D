import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';
import ProfileMiniCard from '../sidebar/ProfileMiniCard';
import TrendingWidget from '../sidebar/TrendingWidget';
const AppLayout = () => {
  const location = useLocation(); const feed = location.pathname.startsWith('/feed');
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <a href="#main-content" className="skip-link">Skip to content</a><Navbar />
    <Container maxWidth={false} sx={{ maxWidth: 1240, py: { xs: 2, sm: 2.5 }, pb: { xs: 11, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {feed ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '210px minmax(0,1fr)', lg: '230px minmax(0,1fr) 260px' }, gap: 2, alignItems: 'start' }}>
        <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0, position: 'sticky', top: 88 }}><ProfileMiniCard /></Box>
        <Box component="main" id="main-content" tabIndex={-1} sx={{ minWidth: 0, outline: 'none' }}><Outlet /></Box>
        <Box component="aside" sx={{ display: { xs: 'none', lg: 'block' }, minWidth: 0, position: 'sticky', top: 88 }}><TrendingWidget /></Box>
      </Box> : <Box component="main" id="main-content" tabIndex={-1} sx={{ maxWidth: location.pathname.startsWith('/profile') ? 960 : 1160, mx: 'auto', minWidth: 0, outline: 'none' }}><Outlet /></Box>}
    </Container>
  </Box>;
};
export default AppLayout;
