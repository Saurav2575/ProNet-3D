import CareerMatrix from '../components/visual/CareerMatrix';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNetwork } from '../store/slices/networkSlice';
import { fetchMe } from '../store/slices/authSlice';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Chip, Grid, Alert,
} from '@mui/material';
import { Users, UserPlus, Search, UserCheck } from 'lucide-react';
import UserAvatar from '../components/common/UserAvatar';
import GoButton from '../components/common/GoButton';
import Input from '../components/common/Input';
import EmptyState, { LoadingState } from '../components/common/EmptyState';
import { connectionAPI, userAPI } from '../services';
import tokens from '../assets/tokens';

const Network = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { connections, pending, suggestions, loading, error: loadError } = useSelector(s=>s.network);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const loadData = () => dispatch(fetchNetwork(true));

  useEffect(() => { dispatch(fetchNetwork()); }, [dispatch]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setSearchQuery(q); handleSearch(q); }
  }, [searchParams]);

  const handleSearch = async (q) => {
    if (!q?.trim()) { setSearchResults([]); return; }
    try { const {data} = await userAPI.search(q); setSearchResults(data); setTab(3); setError(''); } catch(err) { setError(err.response?.data?.message || 'Search failed.'); }
  };

  const handleRespond = async (id, action) => {
    try { await connectionAPI.respond(id,action); loadData(); dispatch(fetchMe()); setError(''); } catch(err) { setError(err.response?.data?.message || 'Could not respond to this invitation.'); }
  };

  const handleConnect = async (userId) => {
    try { await connectionAPI.sendRequest(userId); loadData(); setSearchResults(prev=>prev.filter(p=>p._id!==userId)); setError(''); } catch(err) { setError(err.response?.data?.message || 'Could not send this invitation.'); }
  };

  // Grid suggestion card
  const SuggestionCard = ({ person }) => (
    <Card
      className="depth-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: tokens.shadow.md },
      }}
    >
      {/* Mini cover */}
      <Box
        sx={{ width: '100%', height: 64, background: tokens.gradient.cover, flexShrink: 0 }}
      />
      <CardContent sx={{ pt: 0, px: 2, pb: '16px !important', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%' }}>
        <Box sx={{ mt: -4, mb: 1.5 }}>
          <UserAvatar user={person} size={60} sx={{ border: '3px solid', borderColor: 'background.paper' }} />
        </Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 0.25, cursor: 'pointer', '&:hover': { color: tokens.primary } }}
          onClick={() => navigate(`/profile/${person._id}`)}
        >
          {person.firstName} {person.lastName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, lineHeight: 1.4, display: 'block', minHeight: 32 }}>
          {person.headline || person.company || 'Professional'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', mb: 1.5 }}>
          Professional network
        </Typography>
        <GoButton
          size="small"
          variant="outlined"
          fullWidth
          onClick={() => handleConnect(person._id)}
          startIcon={<UserPlus size={14} />}
          sx={{ mt: 'auto' }}
        >
          Connect
        </GoButton>
      </CardContent>
    </Card>
  );

  // Row connection card
  const PersonRow = ({ person, action }) => (
    <Card sx={{ mb: 1.5, animation: 'fadeInUp 0.3s ease' }}>
      <CardContent
        sx={{
          display: 'flex',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          alignItems: 'center',
          gap: 2,
          py: '12px !important',
          px: 2,
        }}
      >
        <UserAvatar user={person} size={50} />
        <Box
          sx={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
          onClick={() => navigate(`/profile/${person._id}`)}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, '&:hover': { color: tokens.primary } }}>
            {person.firstName} {person.lastName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
            {person.headline || person.company || 'Professional'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Professional network
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0 }}>{action}</Box>
      </CardContent>
    </Card>
  );

  if (loading) return <LoadingState rows={4} />;

  return (
    <>
      {(error || loadError) && <Alert severity="error" sx={{mb:2}}>{error || loadError}</Alert>}
      <Box sx={{mb:2.5}}><Typography sx={{fontSize:10,fontWeight:750,letterSpacing:'.16em',color:'primary.main'}}>YOUR PROFESSIONAL WORLD</Typography><Typography component="h1" variant="h4" sx={{mt:.6,fontSize:28}}>Your network</Typography><Typography sx={{fontSize:12,color:'text.secondary',mt:.7}}>Manage connections, meet new people, and keep the conversation going.</Typography></Box>
      <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:1.5,mb:2.5}}>{[[connections.length,'Connections'],[pending.length,'Invitations'],[suggestions.length,'People to discover']].map(([value,label])=><Card key={label}><CardContent sx={{p:2,'&:last-child':{pb:2}}}><Typography sx={{fontSize:24,fontWeight:750}}>{value}</Typography><Typography sx={{fontSize:10,color:'text.secondary'}}>{label}</Typography></CardContent></Card>)}</Box>
      <CareerMatrix compact />
      {/* Search Bar */}
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
        sx={{ mb: 2.5, display: 'flex', gap: 1 }}
      >
        <Input
          placeholder="Search by name or headline..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search size={16} color={tokens.muted} style={{ marginRight: 8 }} />,
          }}
          sx={{ flex: 1 }}
        />
        <GoButton type="submit" sx={{ minWidth: 80 }}>
          Search
        </GoButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label={`My Network (${connections.length})`} />
          <Tab
            label={`Invitations (${pending.length})`}
            icon={pending.length > 0 ? <Chip label={pending.length} size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} /> : undefined}
            iconPosition="end"
          />
          <Tab label="People You May Know" />
          <Tab label={`Results (${searchResults.length})`} />
        </Tabs>
      </Box>

      {/* My Connections */}
      {tab === 0 && (
        connections.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No connections yet"
            description="Grow your network by connecting with professionals."
            action={<GoButton onClick={() => setTab(2)}>Find people you may know</GoButton>}
          />
        ) : (
          connections.map((person) => (
            <PersonRow
              key={person._id}
              person={person}
              action={
                <Chip
                  icon={<UserCheck size={14} />}
                  label="Connected"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              }
            />
          ))
        )
      )}

      {/* Invitations */}
      {tab === 1 && (
        pending.length === 0 ? (
          <EmptyState icon={UserPlus} title="No pending invitations" />
        ) : (
          pending.map((req) => (
            <PersonRow
              key={req._id}
              person={req.requester}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <GoButton size="small" onClick={() => handleRespond(req._id, 'accept')}>Accept</GoButton>
                  <GoButton size="small" variant="outlined" onClick={() => handleRespond(req._id, 'reject')}>Ignore</GoButton>
                </Box>
              }
            />
          ))
        )
      )}

      {/* Suggestions (Grid) */}
      {tab === 2 && (
        suggestions.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No suggestions right now"
            description="Check back later for people you may know."
          />
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              People you may know
            </Typography>
            <Grid container spacing={2}>
              {suggestions.map((person) => (
                <Grid item xs={12} sm={6} md={4} key={person._id}>
                  <SuggestionCard person={person} />
                </Grid>
              ))}
            </Grid>
          </>
        )
      )}

      {/* Search Results (Grid) */}
      {tab === 3 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Search results for "{searchQuery}"
          </Typography>
          <Grid container spacing={2}>
            {searchResults.map((person) => (
              <Grid item xs={12} sm={6} key={person._id}>
                <PersonRow
                  person={person}
                  action={<GoButton size="small" onClick={() => handleConnect(person._id)}>Connect</GoButton>}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </>
  );
};

export default Network;
