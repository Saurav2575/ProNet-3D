import { profileCompleteness } from '../utils/profileCompleteness';
import tokens from '../assets/tokens';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, Tabs, Tab, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, Button, Stack, Divider } from '@mui/material';
import { Briefcase, MapPin, Building2 } from 'lucide-react';
import GoButton from '../components/common/GoButton';
import EmptyState, { LoadingState } from '../components/common/EmptyState';
import { fetchJobs } from '../store/slices/jobsSlice';
import { jobAPI } from '../services';
import { formatDate } from '../utils/helpers';
const types = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const statuses = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'];
const blank = { title: '', company: '', location: 'Remote', type: 'full-time', description: '', salary: '' };
const Jobs = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const { jobs, applications, myJobs, loading, error: loadError } = useSelector(s => s.jobs);
  const { user } = useSelector(s => s.auth);
  const tab = ['browse', 'applications', 'recruiter'].includes(params.get('tab')) ? params.get('tab') : 'browse';
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [applying, setApplying] = useState(null);
  const [application, setApplication] = useState({ coverLetter: '', resumeUrl: '' });
  const [trackingJob, setTrackingJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const load = (requestedPage = page) => dispatch(fetchJobs({ q: search, location, type, page: requestedPage }));
  useEffect(() => { dispatch(fetchJobs({})); }, [dispatch]);
  // Keep details synchronized after editing a listing or submitting an application.
  useEffect(() => { setSelected(prev => jobs.find(j => j._id === prev?._id) || jobs[0] || null); }, [jobs]);
  const applied = id => applications.some(a => a.job?._id === id);
  const edit = job => { setEditingId(job?._id || null); setForm(job ? Object.fromEntries(Object.keys(blank).map(k => [k, job[k] || blank[k]])) : { ...blank }); setError(''); setEditor(true); };
  const save = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { if (editingId) await jobAPI.update(editingId, form); else await jobAPI.create(form); setEditor(false); setSuccess(editingId ? 'Job updated.' : 'Job published.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not save this job.'); } finally { setBusy(false); }
  };
  const apply = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await jobAPI.apply(applying._id, application); setApplying(null); setApplication({ coverLetter: '', resumeUrl: '' }); setSuccess('Your application was submitted. Track it under My applications.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not submit your application.'); } finally { setBusy(false); }
  };
  const toggleJob = async job => {
    setBusy(true); setError('');
    try { await jobAPI.update(job._id, { isActive: !job.isActive }); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not change job availability.'); } finally { setBusy(false); }
  };
  const track = async job => {
    setTrackingJob(job); setTrackingLoading(true); setApplicants([]); setError('');
    try { const { data } = await jobAPI.applicants(job._id); setApplicants(data); }
    catch (err) { setError(err.response?.data?.message || 'Could not load applicants.'); } finally { setTrackingLoading(false); }
  };
  const status = async (id, value) => {
    setBusy(true); setError('');
    try { await jobAPI.updateStatus(id, value); setApplicants(prev => prev.map(a => a._id === id ? { ...a, status: value } : a)); }
    catch (err) { setError(err.response?.data?.message || 'Could not update this application.'); } finally { setBusy(false); }
  };
  const find = e => { e.preventDefault(); setPage(1); load(1); };
  return <>
    <Card sx={{mb:2.5,overflow:'hidden'}}><Box sx={{background:tokens.gradient.hero,color:'#fff',px:{xs:2.5,sm:3.5},py:3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:2,flexWrap:'wrap'}}><Box><Typography sx={{color:'#00D4B2',fontSize:10,fontWeight:750,letterSpacing:'.17em'}}>YOUR NEXT CHAPTER</Typography><Typography component="h1" variant="h4" sx={{mt:1,fontSize:{xs:25,sm:29}}}>Career opportunities</Typography><Typography sx={{fontSize:12,color:'#B0C6D8',mt:1}}>Find a role, share an opening, and track what comes next.</Typography></Box><GoButton onClick={()=>edit(null)} sx={{flexShrink:0}}>Post a job</GoButton></Box><Box sx={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>{[[applications.length,'Applications'],[myJobs.filter(j=>j.isActive).length,'Your open listings'],[`${profileCompleteness(user)}%`,'Profile completeness']].map(([value,label])=><Box key={label} sx={{p:2,textAlign:'center',borderRight:'1px solid',borderColor:'divider','&:last-child':{borderRight:0}}}><Typography sx={{fontSize:20,fontWeight:750}}>{value}</Typography><Typography sx={{fontSize:10,color:'text.secondary'}}>{label}</Typography></Box>)}</Box></Card>
    {(error || loadError) && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error || loadError}</Alert>}
    {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
    <Tabs value={tab} onChange={(_, value) => setParams({ tab: value })} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}><Tab label="Browse jobs" value="browse" /><Tab label="My applications" value="applications" /><Tab label="Recruiter dashboard" value="recruiter" /></Tabs>
    {tab === 'browse' && <>
      <Box component="form" onSubmit={find} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5, p:2, bgcolor:'background.paper',border:'1px solid',borderColor:'divider',borderRadius:'12px' }}>
        <TextField label="Job title or company" size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: '1 1 180px' }} inputProps={{ maxLength: 150 }} />
        <TextField label="Location" size="small" value={location} onChange={e => setLocation(e.target.value)} sx={{ flex: '1 1 150px' }} inputProps={{ maxLength: 150 }} />
        <TextField label="Job type" size="small" select value={type} onChange={e => setType(e.target.value)} sx={{ minWidth: 140 }}><MenuItem value="">All types</MenuItem>{types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
        <GoButton type="submit">Search</GoButton>
      </Box>
      {loading ? <LoadingState rows={3} /> : !jobs.length ? <EmptyState icon={Briefcase} title="No jobs found" description="Try another title, location, or job type." /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.3fr)' }, gap: 2 }}>
        <Stack spacing={1.5}>{jobs.map(job => <Card className="depth-card" key={job._id} variant="outlined" sx={{ borderColor: selected?._id === job._id ? 'primary.main' : 'divider' }}><CardContent><Button sx={{ p: 0, justifyContent: 'flex-start', textAlign: 'left' }} onClick={() => setSelected(job)}><Box sx={{width:38,height:38,display:'grid',placeItems:'center',bgcolor:'action.hover',borderRadius:2,mr:1.5,color:'primary.main',flexShrink:0,fontWeight:750}}>{job.company?.slice(0,1)}</Box><Typography fontWeight={700}>{job.title}</Typography></Button><Typography variant="body2" color="text.secondary">{job.company} · {job.location}</Typography><Chip label={job.type} size="small" sx={{ mt: 1 }} /></CardContent></Card>)}</Stack>
        {selected && <Card><CardContent><Typography variant="h5" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{selected.title}</Typography><Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}><Building2 size={16} /><Typography>{selected.company}</Typography></Stack><Stack direction="row" alignItems="center" spacing={1}><MapPin size={16} /><Typography color="text.secondary">{selected.location}</Typography></Stack><Chip label={selected.type} size="small" sx={{ my: 1 }} />{selected.salary && <Typography>Salary: {selected.salary}</Typography>}<Typography variant="caption" color="text.secondary">Posted {formatDate(selected.createdAt)}</Typography><Divider sx={{ my: 2 }} /><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mb: 2 }}>{selected.description}</Typography><GoButton disabled={applied(selected._id) || selected.postedBy?._id === user?._id} onClick={() => { setApplying(selected); setError(''); }}>{applied(selected._id) ? 'Applied' : selected.postedBy?._id === user?._id ? 'Your listing' : 'Apply now'}</GoButton></CardContent></Card>}
      </Box>}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}><Button disabled={page === 1 || loading} onClick={() => { setPage(page - 1); load(page - 1); }}>Previous page</Button><Button disabled={jobs.length < 50 || loading} onClick={() => { setPage(page + 1); load(page + 1); }}>Next page</Button></Stack>
    </>}
    {tab === 'applications' && (loading ? <LoadingState /> : !applications.length ? <EmptyState icon={Briefcase} title="No applications yet" description="Apply to a job to see its progress here." /> : <Stack spacing={2}>{applications.map(a => <Card key={a._id}><CardContent><Typography fontWeight={700}>{a.job?.title || 'Removed listing'}</Typography><Typography color="text.secondary">{a.job?.company} · {a.job?.location}</Typography><Chip label={a.status} color={a.status === 'hired' ? 'success' : 'default'} sx={{ my: 1 }} />{a.job && !a.job.isActive && <Chip label="Listing closed" size="small" sx={{ ml: 1 }} />}<Typography variant="caption" display="block">Applied {formatDate(a.createdAt)}</Typography><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.coverLetter}</Typography><Button component="a" href={a.resumeUrl || undefined} disabled={!a.resumeUrl} target="_blank" rel="noopener noreferrer">View resume</Button></CardContent></Card>)}</Stack>)}
    {tab === 'recruiter' && (loading ? <LoadingState /> : !myJobs.length ? <EmptyState icon={Briefcase} title="No listings yet" description="Post a job to manage applicants here." /> : <Stack spacing={2}>{myJobs.map(job => <Card key={job._id}><CardContent><Typography fontWeight={700}>{job.title}</Typography><Typography color="text.secondary">{job.company} · {job.location}</Typography><Chip label={job.isActive ? 'Open' : 'Closed'} color={job.isActive ? 'success' : 'default'} size="small" sx={{ my: 1 }} /><Typography variant="body2">{job.applicants?.length || 0} applicants</Typography><Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}><GoButton size="small" onClick={() => track(job)}>View applicants</GoButton><Button onClick={() => edit(job)}>Edit job</Button><Button disabled={busy} onClick={() => toggleJob(job)}>{job.isActive ? 'Close listing' : 'Reopen listing'}</Button></Box></CardContent></Card>)}</Stack>)}
    <Dialog open={editor} onClose={() => !busy && setEditor(false)} fullWidth maxWidth="sm"><DialogTitle>{editingId ? 'Edit job' : 'Post a job'}</DialogTitle><DialogContent><Box component="form" id="job-form" onSubmit={save} sx={{ pt: 1, display: 'grid', gap: 2 }}>{error && <Alert severity="error">{error}</Alert>}{['title', 'company', 'location', 'salary'].map(field => <TextField key={field} label={{ title: 'Job title', company: 'Company', location: 'Location', salary: 'Salary (optional)' }[field]} required={['title', 'company'].includes(field)} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} inputProps={{ maxLength: field === 'salary' ? 100 : 150 }} />)}<TextField select label="Job type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField><TextField label="Description" required multiline rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} inputProps={{ maxLength: 5000 }} /></Box></DialogContent><DialogActions><Button disabled={busy} onClick={() => setEditor(false)}>Cancel</Button><GoButton type="submit" form="job-form" loading={busy}>{editingId ? 'Save changes' : 'Publish job'}</GoButton></DialogActions></Dialog>
    <Dialog open={!!applying} onClose={() => !busy && setApplying(null)} fullWidth maxWidth="sm"><DialogTitle>Apply for {applying?.title}</DialogTitle><DialogContent><Box component="form" id="application-form" onSubmit={apply} sx={{ pt: 1, display: 'grid', gap: 2 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Cover letter" required multiline rows={5} value={application.coverLetter} onChange={e => setApplication({ ...application, coverLetter: e.target.value })} inputProps={{ maxLength: 3000 }} helperText="Explain your interest and relevant experience." /><TextField label="Resume URL" type="url" required value={application.resumeUrl} onChange={e => setApplication({ ...application, resumeUrl: e.target.value })} inputProps={{ maxLength: 1000 }} helperText="Paste a public HTTP/HTTPS link to your resume." /></Box></DialogContent><DialogActions><Button disabled={busy} onClick={() => setApplying(null)}>Cancel</Button><GoButton type="submit" form="application-form" loading={busy}>Submit application</GoButton></DialogActions></Dialog>
    <Dialog open={!!trackingJob} onClose={() => setTrackingJob(null)} fullWidth maxWidth="md"><DialogTitle>Applicants — {trackingJob?.title}</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{trackingLoading ? <LoadingState /> : !applicants.length ? <Typography>No applications received yet.</Typography> : <Stack spacing={2}>{applicants.map(a => <Card key={a._id} variant="outlined"><CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}><Box><Typography component={Link} to={`/profile/${a.applicant?._id}`} color="primary.main" fontWeight={700}>{a.applicant?.firstName} {a.applicant?.lastName}</Typography><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{a.applicant?.email}</Typography></Box><TextField select label="Application status" size="small" disabled={busy} value={a.status} onChange={e => status(a._id, e.target.value)} sx={{ minWidth: 170 }}>{statuses.map(s => <MenuItem value={s} key={s}>{s}</MenuItem>)}</TextField></Box><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 2 }}>{a.coverLetter}</Typography><Button component="a" href={a.resumeUrl || undefined} disabled={!a.resumeUrl} target="_blank" rel="noopener noreferrer">View resume</Button></CardContent></Card>)}</Stack>}</DialogContent><DialogActions><Button onClick={() => setTrackingJob(null)}>Close</Button></DialogActions></Dialog>
  </>;
};
export default Jobs;
