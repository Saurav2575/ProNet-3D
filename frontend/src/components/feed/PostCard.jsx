import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card, CardContent, Box, Typography, IconButton,
  Collapse, Divider, Tooltip, Menu, MenuItem, Alert,
} from '@mui/material';
import { ThumbsUp, MessageSquare, Send, Trash2, MoreHorizontal, Globe2 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import Input from '../common/Input';
import GoButton from '../common/GoButton';
import { toggleLike, addCommentToPost, removePost } from '../../store/slices/feedSlice';
import { postAPI } from '../../services';
import { formatDate } from '../../utils/helpers';
import tokens from '../../assets/tokens';

const ActionBtn = ({ icon: Icon, label, count, active, color, onClick }) => (
  <Box
    component="button"
    type="button"
    aria-label={label}
    aria-pressed={!!active}
    onClick={onClick}
    sx={{
      border: 0, background: 'transparent', fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: 0.6,
      px: { xs: 1, sm: 2 },
      py: 0.75,
      borderRadius: tokens.radius.md,
      cursor: 'pointer',
      color: active ? color : 'text.secondary',
      transition: 'all 0.15s ease',
      userSelect: 'none',
      flex: 1,
      justifyContent: 'center',
      '&:hover': {
        bgcolor: active ? `${color}14` : 'action.hover',
        color: active ? color : 'text.primary',
        transform: 'translateY(-1px)',
      },
    }}
  >
    <Icon
      size={18}
      fill={active ? color : 'none'}
      strokeWidth={active ? 2.5 : 1.8}
      style={active ? { animation: 'likePoP 0.3s ease' } : {}}
    />
    {count !== undefined && (
      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
        {count > 0 ? count : label}
      </Typography>
    )}
    {count === undefined && (
      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.78rem', display: { xs: 'none', sm: 'block' } }}>
        {label}
      </Typography>
    )}
  </Box>
);

const PostCard = ({ post: originalPost }) => {
  const [post, setPost] = useState(originalPost);
  const [error, setError] = useState('');
  const [liking, setLiking] = useState(false);
  const [removed, setRemoved] = useState(false);
  useEffect(() => { setPost(originalPost); }, [originalPost]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const isLiked = post.likes?.some(
    (id) => (typeof id === 'string' ? id : id._id) === user?._id
  );
  const isAuthor = post.author?._id === user?._id;
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  const contentLimit = 250;
  const longContent = post.content?.length > contentLimit;
  const displayContent = longContent && !expanded
    ? post.content.slice(0, contentLimit) + '...'
    : post.content;

  const handleLike = async () => {
    if (liking) return; setLiking(true); setError('');
    try { const result = await dispatch(toggleLike(post._id)).unwrap(); setPost(prev => ({...prev, likes: result.likeIds})); } catch(err) { setError(String(err)); } finally { setLiking(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await postAPI.comment(post._id, commentText.trim());
      dispatch(addCommentToPost({ postId: post._id, comment: data }));
      setPost(prev => ({...prev, comments: [...(prev.comments || []), data]}));
      setCommentText('');
    } catch(err) { setError(err.response?.data?.message || 'Could not add your comment.'); } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setMenuAnchor(null);
    if (window.confirm('Delete this post?')) {
      try { await postAPI.delete(post._id); dispatch(removePost(post._id)); setRemoved(true); } catch(err) { setError(err.response?.data?.message || 'Could not delete this post.'); }
    }
  };

  if (removed) return null;
  return (
    <Card
      component="article"
      sx={{
        mb: 2,
        animation: 'fadeInUp 0.4s ease',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: tokens.shadow.md,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
        {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
        {/* Header */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <UserAvatar
            user={post.author}
            size={46}
            sx={{ cursor: 'pointer', flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{ cursor: 'pointer', display: 'inline-block' }}
              onClick={() => navigate(`/profile/${post.author?._id}`)}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  '&:hover': { color: tokens.primary },
                  lineHeight: 1.3,
                }}
              >
                {post.author?.firstName} {post.author?.lastName}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
              {post.author?.headline || 'Professional'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {formatDate(post.createdAt)} · <Globe2 size={11} style={{verticalAlign:'middle'}} />
            </Typography>
          </Box>

          {isAuthor && <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
            <Tooltip title="More options">
              <IconButton
                size="small"
                aria-label="More options"
                sx={{ color: 'text.secondary' }}
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreHorizontal size={16} />
              </IconButton>
            </Tooltip>
          </Box>}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            PaperProps={{ sx: { borderRadius: tokens.radius.md, minWidth: 160 } }}
          >
            {isAuthor && (
              <MenuItem onClick={handleDelete} sx={{ color: tokens.error, gap: 1 }}>
                <Trash2 size={15} /> Delete post
              </MenuItem>
            )}
          </Menu>
        </Box>

        {/* Content */}
        <Typography
          variant="body2"
          sx={{ color: 'text.primary', mb: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.65, fontSize: '0.875rem' }}
        >
          {displayContent}
        </Typography>
        {longContent && (
          <Typography
            variant="caption"
            sx={{ color: tokens.primary, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'See more'}
          </Typography>
        )}

        {/* Post Image */}
        {post.image && (
          <Box
            component="img"
            src={post.image}
            alt="Post"
            sx={{
              width: '100%',
              borderRadius: tokens.radius.md,
              mt: 1.5,
              mb: 1,
              maxHeight: 400,
              objectFit: 'cover',
            }}
          />
        )}

        {/* Like / Comment Count */}
        {(likeCount > 0 || commentCount > 0) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 1.5,
              mb: 0.5,
              py: 0.75,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {likeCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: tokens.gradient.brand,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThumbsUp size={10} color="white" fill="white" />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                  {isLiked
                    ? likeCount === 1
                      ? 'You'
                      : `You and ${likeCount - 1} others`
                    : likeCount}
                </Typography>
              </Box>
            )}
            {commentCount > 0 && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', cursor: 'pointer', fontSize: '0.78rem', '&:hover': { color: tokens.primary, textDecoration: 'underline' } }}
                onClick={() => setShowComments(!showComments)}
              >
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        )}

        {/* Action Bar */}
        <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
          <ActionBtn
            icon={ThumbsUp}
            label="Like"
            count={likeCount || undefined}
            active={isLiked}
            color={tokens.primary}
            onClick={handleLike}
          />
          <ActionBtn
            icon={MessageSquare}
            label="Comment"
            count={commentCount || undefined}
            active={showComments}
            color={tokens.accent}
            onClick={() => setShowComments(!showComments)}
          />
        </Box>

        {/* Comments Section */}
        <Collapse in={showComments}>
          <Divider sx={{ mt: 1, mb: 2 }} />
          <Box>
            {(post.comments || []).map((comment) => (
              <Box key={comment._id} sx={{ display: 'flex', gap: 1.25, mb: 2 }}>
                <UserAvatar user={comment.author} size={32} />
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: `${tokens.radius.sm} ${tokens.radius.lg} ${tokens.radius.lg} ${tokens.radius.lg}`,
                    px: 1.75,
                    py: 1.25,
                    flex: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                    {comment.author?.firstName} {comment.author?.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {comment.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                    {formatDate(comment.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Comment input */}
            <Box component="form" onSubmit={handleComment} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <UserAvatar user={user} size={32} />
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <GoButton
                aria-label="Submit comment"
                type="submit"
                size="small"
                loading={submitting}
                disabled={!commentText.trim()}
                sx={{ minHeight: 36, px: 1.5 }}
              >
                <Send size={15} />
              </GoButton>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PostCard;
