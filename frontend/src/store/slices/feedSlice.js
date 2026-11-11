import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services';

export const fetchFeed = createAsyncThunk('feed/fetchFeed', async (input = 1, { rejectWithValue }) => {
  try {
    const { data } = await postAPI.getFeed(typeof input === 'number' ? input : input.page, typeof input === 'number' ? 'all' : input.scope);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load feed');
  }
});

export const createPost = createAsyncThunk('feed/createPost', async (content, { rejectWithValue }) => {
  try {
    const { data } = await postAPI.create(typeof content === 'string' ? { content } : content);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create post');
  }
});

export const toggleLike = createAsyncThunk('feed/toggleLike', async (postId, { rejectWithValue }) => {
  try {
    const { data } = await postAPI.like(postId);
    return { postId, ...data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to like post');
  }
});

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    page: 1,
    pages: 1,
    total: 0,
    loading: false,
    creating: false,
    error: null,
  },
  reducers: {
    removePost: (state, action) => { state.posts = state.posts.filter(p => p._id !== action.payload); },
    addCommentToPost: (state, action) => {
      const { postId, comment } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        post.comments = [...(post.comments || []), comment];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.page === 1 ? action.payload.posts : [...state.posts, ...action.payload.posts.filter(p => !state.posts.some(old => old._id === p._id))];
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPost.pending, (state) => {
        state.creating = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.creating = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p._id === action.payload.postId);
        if (post) {
          post.likes = action.payload.likeIds;
        }
      });
  },
});

export const { addCommentToPost, removePost } = feedSlice.actions;
export default feedSlice.reducer;
