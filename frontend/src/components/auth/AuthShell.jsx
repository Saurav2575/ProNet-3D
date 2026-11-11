import { Box, Typography, Card, CardContent } from '@mui/material';
import { Users, Briefcase, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
const AuthShell = ({ children, title, subtitle, signup = false }) => <Box component="main" sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.paper' }}>
  <Box component="aside" aria-label="About ProNet" sx={{ display: { xs: 'none', md: 'flex' }, width: '44%', minHeight: '100vh', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#0A2540', color: '#fff', p: { md: 5, lg: 7 } }}>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', zIndex: 1 }}><Logo inverse /><Box sx={{ border: '1px solid rgba(255,255,255,.2)', borderRadius: 1, p: .75, fontSize: 9, letterSpacing: '.13em', color: '#00D4B2', fontWeight: 700 }}>PROFESSIONAL NETWORK</Box></Box>
    <Box sx={{ my: 5, ml: 3 }} className="auth-globe-wrap" aria-hidden="true"><div className="auth-globe" /></Box>
    <Box sx={{ mt: 'auto', maxWidth: 470, zIndex: 1 }}>
      <Typography sx={{ color: '#00D4B2', fontSize: 11, fontWeight: 700, letterSpacing: '.18em', mb: 2 }}>CONNECTIONS. IDEAS. OPPORTUNITIES.</Typography>
      <Typography component="h2" sx={{ fontSize: { md: 36, lg: 46 }, fontWeight: 750, letterSpacing: '-.045em', lineHeight: 1.1 }}>{signup ? 'Your next chapter starts with a connection.' : 'A new perspective on your professional world.'}</Typography>
      <Typography sx={{ mt: 2.5, color: '#B0C6D8', fontSize: 14, lineHeight: 1.9, maxWidth: 390 }}>Share your work, meet people who inspire you, and discover opportunities for your next step.</Typography>
      <Box sx={{ mt: 3.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>{[{ icon: Users, title: 'Build connections', detail: 'People, ideas & conversations' }, { icon: Briefcase, title: 'Find your next role', detail: 'Applications you can track' }].map(({ icon: Icon, title: label, detail }) => <Box key={label} sx={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 2, bgcolor: 'rgba(255,255,255,.05)', p: 2 }}><Icon size={20} color="#00D4B2" /><Typography sx={{ fontSize: 12, fontWeight: 700, mt: 1 }}>{label}</Typography><Typography sx={{ fontSize: 10, color: '#B0C6D8', mt: .5 }}>{detail}</Typography></Box>)}</Box>
      <Typography sx={{ mt: 3, color: '#B0C6D8', fontSize: 10 }}>A space to share your professional story.</Typography>
    </Box>
    <div className="auth-orbit" />
  </Box>
  <Box component="section" sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2.5, sm: 5 }, py: 5 }}>
    <Box sx={{ width: '100%', maxWidth: 430 }}>
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}><Logo /></Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><Typography sx={{ fontSize: 11, fontWeight: 750, color: 'text.secondary', letterSpacing: '.14em' }}>{signup ? 'JOIN THE NETWORK' : 'MEMBER ACCESS'}</Typography><Link to={signup ? '/login' : '/register'} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>{signup ? 'Sign in' : 'Create account'}<ArrowUpRight size={13} /></Link></Box>
      <Typography component="h1" variant="h4" sx={{ fontSize: 28 }}>{title}</Typography><Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 1 }}>{subtitle}</Typography>
      <Card sx={{ mt: 3, mb: 2.5 }}><CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: 3 } }}>{children}</CardContent></Card>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>{signup ? 'Already have an account?' : 'New to ProNet?'} <Link to={signup ? '/login' : '/register'} style={{ color: '#0066FF', fontWeight: 700 }}>{signup ? 'Sign in' : 'Create a free account'}</Link></Typography>
    </Box>
  </Box>
</Box>;
export default AuthShell;
