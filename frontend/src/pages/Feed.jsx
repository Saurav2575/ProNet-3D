import CareerMatrix from '../components/visual/CareerMatrix';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Alert, Tabs, Tab } from '@mui/material';
import { Newspaper } from 'lucide-react';
import PostShareBox from '../components/feed/PostShareBox';
import PostCard from '../components/feed/PostCard';
import EmptyState, { LoadingState } from '../components/common/EmptyState';
import { fetchFeed } from '../store/slices/feedSlice';
import GoButton from '../components/common/GoButton';

const Feed = () => {
  const dispatch = useDispatch();
  const [scope, setScope] = useState('all');
  const { posts, loading, pages, page, error } = useSelector((state) => state.feed);

  useEffect(() => {
    dispatch(fetchFeed({page:1,scope}));
  }, [dispatch,scope]);

  return (
    <Box>
      <CareerMatrix />
      <PostShareBox />
      <Tabs value={scope} onChange={(_,v)=>setScope(v)} sx={{mb:2}}><Tab label="All posts" value="all"/><Tab label="My network" value="network"/></Tabs>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
      {loading ? (
        <LoadingState rows={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Your feed is empty"
          description="Be the first to share an update with your network — your connections will see it here."
          
        />
      ) : (
        <>
          {posts.map((post, i) => (
            <Box
              key={post._id}
              sx={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}
            >
              <PostCard post={post} />
            </Box>
          ))}
          {page < pages && (
            <Box sx={{ textAlign: 'center', mt: 1, mb: 2 }}>
              <GoButton
                variant="outlined"
                onClick={() => dispatch(fetchFeed({page:page + 1,scope}))}
                sx={{ minWidth: 180 }}
              >
                Load more posts
              </GoButton>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Feed;
