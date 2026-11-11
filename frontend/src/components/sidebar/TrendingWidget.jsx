import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Divider, Alert } from '@mui/material';
import { ArrowUpRight, TrendingUp, UserPlus } from 'lucide-react';
import { postAPI, connectionAPI } from '../../services';
import { fetchNetwork } from '../../store/slices/networkSlice';
import UserAvatar from '../common/UserAvatar';
const TrendingWidget = () => {
  const dispatch = useDispatch(); const [popular, setPopular] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState('');
  const posts = useSelector(s => s.feed.posts), { suggestions } = useSelector(s => s.network);
  useEffect(() => { dispatch(fetchNetwork()); }, [dispatch]);
  useEffect(() => { let active = true; postAPI.getPopular().then(({ data }) => { if (active) setPopular(data); }).catch(() => { if (active) setPopular([]); }); return () => { active = false; }; }, [posts]);
  const connect = async id => { setBusy(id); setError(''); try { await connectionAPI.sendRequest(id); await dispatch(fetchNetwork(true)); } catch (e) { setError(e.response?.data?.message || 'Could not send invitation.'); } finally { setBusy(''); } };
  return <>
    <Card sx={{ mb: 2 }}><CardContent sx={{ p: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography sx={{ fontSize: 14, fontWeight: 750 }}>Popular posts</Typography><TrendingUp size={16} color="#0066FF" /></Box><Typography sx={{ fontSize: 10, color: 'text.secondary', mt: .5, mb: 1.5 }}>Conversations from the ProNet community</Typography>{popular.length ? popular.slice(0, 4).map(post => <Box key={post._id} sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1.2 }}><Typography sx={{ fontSize: 11, fontWeight: 600, overflowWrap: 'anywhere', lineHeight: 1.6 }}>{post.content.slice(0, 95)}{post.content.length > 95 ? '…' : ''}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary', mt: .4 }}>{post.likeCount} likes · {post.commentCount} comments</Typography></Box>) : <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Share an update to start a conversation.</Typography>}</CardContent></Card>
    <Card sx={{ mb: 2 }}><CardContent sx={{ p: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}><Typography sx={{ fontSize: 13, fontWeight: 750 }}>People you may know</Typography><Button size="small" component={Link} to="/network" sx={{ minWidth: 0, fontSize: 10, p: 0 }}>See all</Button></Box>{error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}{suggestions.length ? suggestions.slice(0, 3).map(person => <Box key={person._id} sx={{ display: 'flex', gap: 1, borderTop: '1px solid', borderColor: 'divider', py: 1.5 }}><UserAvatar user={person} size={35} /><Box sx={{ minWidth: 0 }}><Typography component={Link} to={`/profile/${person._id}`} sx={{ display: 'block', fontSize: 11, fontWeight: 700 }}>{person.firstName} {person.lastName}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary', mt: .3 }}>{person.headline || 'ProNet member'}</Typography><Button size="small" variant="outlined" disabled={!!busy} onClick={() => connect(person._id)} startIcon={<UserPlus size={12} />} sx={{ fontSize: 10, mt: 1, py: .25, borderRadius: 9 }}>{busy === person._id ? 'Sending…' : 'Connect'}</Button></Box></Box>) : <Typography sx={{ py: 1, color: 'text.secondary', fontSize: 11 }}>Discover more people in your network hub.</Typography>}</CardContent></Card>
    <Card sx={{ background: '#0A2540', color: '#fff' }}><CardContent sx={{ p: 2 }}><Typography sx={{ color: '#00D4B2', fontSize: 9, fontWeight: 750, letterSpacing: '.14em' }}>YOUR NEXT CHAPTER</Typography><Typography sx={{ fontSize: 15, fontWeight: 750, mt: 1 }}>Opportunity starts here.</Typography><Typography sx={{ fontSize: 11, color: '#B0C6D8', mt: 1 }}>Explore roles and follow every step of your application.</Typography><Button component={Link} to="/jobs" endIcon={<ArrowUpRight size={14} />} sx={{ color: '#fff', px: 0, fontSize: 11, mt: 1 }}>Explore jobs</Button></CardContent></Card>
  </>;
};
export default TrendingWidget;
