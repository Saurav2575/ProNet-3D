import { profileCompleteness } from '../utils/profileCompleteness';
import ImageUpload from '../components/common/ImageUpload';
import { fetchMe } from '../store/slices/authSlice';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Chip, IconButton, Grid, Tabs, Tab,
  Tooltip, TextField, Autocomplete, Alert,
} from '@mui/material';
import {
  MapPin, Building2, Pencil, Link as LinkIcon, ExternalLink,
  GraduationCap, Award, Plus, X, CheckCircle,
} from 'lucide-react';
import UserAvatar from '../components/common/UserAvatar';
import PostCard from '../components/feed/PostCard';
import GoButton from '../components/common/GoButton';
import Input from '../components/common/Input';
import { LoadingState } from '../components/common/EmptyState';
import { userAPI, connectionAPI } from '../services';
import tokens from '../assets/tokens';

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'MongoDB', 'Express.js', 'JavaScript', 'TypeScript',
  'Python', 'Java', 'CSS', 'HTML', 'SQL', 'AWS', 'Docker', 'Git',
  'Figma', 'UX Design', 'Product Management', 'Data Analysis',
];

function TabPanel({ children, value, index }) {
  return value === index ? (
    <Box sx={{ animation: 'fadeInUp 0.35s ease' }}>{children}</Box>
  ) : null;
}

const Profile = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const { id } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const profileId = id || currentUser?._id;
  const isOwnProfile = profileId === currentUser?._id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          userAPI.getProfile(profileId),
          userAPI.getUserPosts(profileId),
        ]);
        setProfile(profileRes.data);
        setPosts(postsRes.data);
        setEditForm({
          headline: profileRes.data.headline || '',
          bio: profileRes.data.bio || '',
          location: profileRes.data.location || '',
          company: profileRes.data.company || '',
          role: profileRes.data.role || '',
          skills: profileRes.data.skills || [],
        });

        if (!isOwnProfile) {
          const statusRes = await connectionAPI.getStatus(profileId);
          setConnectionStatus(statusRes.data.status);
        }
      } catch(err) { setError(err.response?.data?.message || 'Could not load this profile.'); } finally {
        setLoading(false);
      }
    };
    if (profileId) load();
  }, [profileId, isOwnProfile]);

  const handleConnect = async () => {
    try { await connectionAPI.sendRequest(profileId); setConnectionStatus('pending'); } catch(err) { setError(err.response?.data?.message || 'Could not send this invitation.'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(editForm);
      setProfile(data);
      setEditing(false);
      dispatch(fetchMe());
    } catch(err) { setError(err.response?.data?.message || 'Could not save your profile.'); } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !editForm.skills?.includes(trimmed)) {
      setEditForm({ ...editForm, skills: [...(editForm.skills || []), trimmed] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setEditForm({ ...editForm, skills: editForm.skills.filter((s) => s !== skill) });
  };

  if (loading) return <LoadingState rows={2} />;
  if (!profile) return <Alert severity="error">{error || 'Profile not found'}</Alert>;
  const uploadPhoto = async (url, field) => { const {data} = await userAPI.updateProfile({[field]:url}); setProfile(data); dispatch(fetchMe()); };

  const displaySkills = editing ? editForm.skills : (profile.skills || []);

  return (
    <>
      <Box sx={{mb:2}}><Typography sx={{fontSize:10,fontWeight:750,letterSpacing:'.15em',color:'primary.main'}}>PROFESSIONAL PROFILE</Typography><Typography component="h1" variant="h4" sx={{fontSize:26,mt:.6}}>{isOwnProfile ? 'Your story. Your next step.' : `${profile.firstName} ${profile.lastName}`}</Typography></Box>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
      {isOwnProfile && <Box sx={{display:"flex",gap:1,mb:2,flexWrap:"wrap"}}><ImageUpload label="Upload profile photo" folder="profiles" onUploaded={url=>uploadPhoto(url,"avatar")}/><ImageUpload label="Upload cover photo" folder="covers" onUploaded={url=>uploadPhoto(url,"coverPhoto")}/></Box>}
      {/* Profile Hero Card */}
      <Card sx={{ mb: 2, overflow: 'visible', animation: 'fadeInUp 0.4s ease' }}>
        {/* Cover Photo */}
        <Box
          sx={{
            height: 160,
            background: profile.coverPhoto ? `url(${profile.coverPhoto}) center / cover` : tokens.gradient.cover,
            borderRadius: `${tokens.radius.lg} ${tokens.radius.lg} 0 0`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle mesh pattern */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)
              `,
            }}
          />

        </Box>

        <CardContent sx={{ pt: 0, px: { xs: 2, sm: 3 }, pb: '24px !important' }}>
          {/* Avatar Row */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
              mt: -6,
              mb: 2,
              gap: 2,
            }}
          >
            <UserAvatar
              user={profile}
              size={96}
              sx={{
                border: '4px solid', borderColor: 'background.paper',
                boxShadow: tokens.shadow.md,
                flexShrink: 0,
              }}
            />
            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, pb: { sm: 0.5 }, mt: { xs: 2, sm: 0 } }}>
              {isOwnProfile ? (
                <GoButton
                  size="small"
                  variant="outlined"
                  onClick={() => setEditing(!editing)}
                  startIcon={<Pencil size={15} />}
                >
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </GoButton>
              ) : ['none','rejected'].includes(connectionStatus) ? (
                <GoButton size="small" onClick={handleConnect}>
                  + Connect
                </GoButton>
              ) : connectionStatus === 'pending' ? (
                <Chip label="Pending" size="small" variant="outlined" color="warning" />
              ) : (
                <>
                  <Chip
                    label="✓ Connected"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                </>
              )}
            </Box>
          </Box>

          {/* Name + Headline */}
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {profile.firstName} {profile.lastName}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
            {profile.headline || (isOwnProfile ? 'Add a headline to introduce yourself' : 'ProNet member')}
          </Typography>

          {/* Meta Info */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
            {profile.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <MapPin size={14} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>{profile.location}</Typography>
              </Box>
            )}
            {profile.company && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <Building2 size={14} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {profile.role} at {profile.company}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Connection count */}
          <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: 'primary.main', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {profile.connectionCount || 0} connections
            </Typography>

          </Box>

        </CardContent>
      </Card>

      {isOwnProfile && <Card sx={{mb:2}}><CardContent sx={{py:2,'&:last-child':{pb:2}}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2}}><Box><Typography sx={{fontWeight:700,fontSize:13}}>Profile completeness</Typography><Typography sx={{fontSize:11,color:'text.secondary',mt:.5}}>Based on your photo, headline, bio, location, company, role, and skills.</Typography></Box><Typography sx={{fontSize:24,fontWeight:750,color:'primary.main'}}>{profileCompleteness(profile)}%</Typography></Box><Box sx={{mt:1.5,height:5,bgcolor:'action.hover',borderRadius:9,overflow:'hidden'}}><Box sx={{height:'100%',width:`${profileCompleteness(profile)}%`,bgcolor:'primary.main',borderRadius:9}}/></Box></CardContent></Card>}
      {/* Edit Form */}
      {editing && (
        <Card sx={{ mb: 2, animation: 'fadeInUp 0.3s ease' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
              Edit Profile
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Input
                  label="Headline"
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  placeholder="Software Engineer at Google"
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  label="Bio"
                  multiline
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell your professional story..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  label="Location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  label="Company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  label="Role / Title"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                />
              </Grid>

              {/* Skills */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  {(editForm.skills || []).map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      onDelete={() => removeSkill(skill)}
                      sx={{
                        bgcolor: `${tokens.primary}18`,
                        color: 'primary.main',
                        fontWeight: 600,
                        '& .MuiChip-deleteIcon': { color: 'primary.main' },
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Autocomplete
                    freeSolo
                    options={SKILL_SUGGESTIONS.filter((s) => !editForm.skills?.includes(s))}
                    inputValue={skillInput}
                    onInputChange={(_, v) => setSkillInput(v)}
                    onChange={(_, v) => { if (v) addSkill(v); }}
                    sx={{ flex: 1 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Add a skill..."
                        size="small"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }
                        }}
                      />
                    )}
                  />
                  <GoButton size="small" variant="outlined" onClick={() => addSkill(skillInput)}>
                    Add
                  </GoButton>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <GoButton onClick={handleSave} loading={saving}>Save Changes</GoButton>
              <GoButton variant="outlined" onClick={() => setEditing(false)}>Cancel</GoButton>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Sections */}
      <Card sx={{ animation: 'fadeInUp 0.5s ease' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Activity" />
            <Tab label="About" />
            <Tab label={`Skills (${displaySkills.length})`} />
          </Tabs>
        </Box>

        {/* Activity Tab */}
        <TabPanel value={tab} index={0}>
          <CardContent>
            {posts.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                No posts yet.
              </Typography>
            ) : (
              posts.map((post) => <PostCard key={post._id} post={post} />)
            )}
          </CardContent>
        </TabPanel>

        {/* About Tab */}
        <TabPanel value={tab} index={1}>
          <CardContent>
            {profile.bio ? (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>About</Typography>
                <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.7 }}>
                  {profile.bio}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                {isOwnProfile ? 'Add a bio to tell your professional story.' : 'No bio added yet.'}
              </Typography>
            )}
          </CardContent>
        </TabPanel>

        {/* Skills Tab */}
        <TabPanel value={tab} index={2}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Skills</Typography>
            {displaySkills.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {isOwnProfile ? 'Add skills to showcase your expertise.' : 'No skills added yet.'}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {displaySkills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    sx={{
                      bgcolor: `${tokens.primary}14`,
                      color: 'primary.main',
                      fontWeight: 600,
                      borderRadius: tokens.radius.sm,
                      '&:hover': { bgcolor: `${tokens.primary}24` },
                    }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </TabPanel>
      </Card>
    </>
  );
};

export default Profile;
