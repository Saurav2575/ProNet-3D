import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Divider, LinearProgress } from '@mui/material';
import { ArrowUpRight, Users, Briefcase } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { profileCompleteness } from '../../utils/profileCompleteness';
import tokens from '../../assets/tokens';
const ProfileMiniCard = () => {
  const { user } = useSelector(s => s.auth); if (!user) return null;
  const complete = profileCompleteness(user);
  return <>
    <Card className="depth-card" sx={{ mb: 2, overflow: 'hidden' }}><Box sx={{ height: 76, background: user.coverPhoto ? `url(${user.coverPhoto}) center/cover` : tokens.gradient.cover }} /><CardContent sx={{ px: 2, pt: 0 }}>
      <Box sx={{ mt: -3.5, mb: 1.2 }}><UserAvatar user={user} size={56} sx={{ border: '4px solid', borderColor: 'background.paper' }} /></Box>
      <Typography component={Link} to={`/profile/${user._id}`} sx={{ fontSize: 15, fontWeight: 750, '&:hover': { color: 'primary.main' } }}>{user.firstName} {user.lastName}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary', mt: .5, mb: 2 }}>{user.headline || 'Make your professional story your own'}</Typography><Divider />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, mb: 1 }}><Typography sx={{ color: 'text.secondary', fontSize: 11 }}>Profile completeness</Typography><Typography sx={{ fontSize: 11, fontWeight: 700 }}>{complete}%</Typography></Box><LinearProgress variant="determinate" value={complete} aria-label="Profile completeness" sx={{ height: 5, borderRadius: 9 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2 }}><Box sx={{ bgcolor: 'action.hover', borderRadius: '8px', p: 1 }}><Typography sx={{ fontSize: 19, fontWeight: 750 }}>{user.connectionCount || 0}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary' }}>CONNECTIONS</Typography></Box><Box sx={{ bgcolor: 'action.hover', borderRadius: '8px', p: 1 }}><Typography sx={{ fontSize: 19, fontWeight: 750 }}>{user.skills?.length || 0}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary' }}>SKILLS</Typography></Box></Box>
      <Button component={Link} to={`/profile/${user._id}`} size="small" endIcon={<ArrowUpRight size={14} />} sx={{ mt: 1.5, px: 0, fontSize: 11 }}>View Full Profile</Button>
    </CardContent></Card>
    <Card sx={{ mb: 2 }}><CardContent sx={{ p: 2 }}><Typography sx={{ fontSize: 10, fontWeight: 750, letterSpacing: '.12em', mb: 1.5 }}>YOUR NEXT STEP</Typography><Button fullWidth component={Link} to="/network" startIcon={<Users size={15} />} sx={{ justifyContent: 'flex-start', px: 0, fontSize: 12 }}>Grow your network</Button><Button fullWidth component={Link} to="/jobs?tab=applications" startIcon={<Briefcase size={15} />} sx={{ justifyContent: 'flex-start', px: 0, fontSize: 12 }}>Track your applications</Button><Divider sx={{ my: 1.5 }} /><Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 1 }}>YOUR SKILLS</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: .6 }}>{user.skills?.length ? user.skills.slice(0, 6).map(skill => <Box key={skill} sx={{ bgcolor: 'action.hover', color: 'primary.main', fontSize: 10, fontWeight: 600, px: 1, py: .5, borderRadius: 1 }}>{skill}</Box>) : <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>Add skills to help tell your story.</Typography>}</Box></CardContent></Card>
    <Typography sx={{ px: 1.5, fontSize: 10, color: 'text.secondary' }}>ProNet · Connect. Share. Grow.</Typography>
  </>;
};
export default ProfileMiniCard;
