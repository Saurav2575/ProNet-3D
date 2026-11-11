import Post from '../models/Post.js';
import { cacheSet, invalidateFeed } from '../services/cache.js';
import { notify } from '../services/notifications.js';
export const getFeed = async (req,res) => {
  const page=Number(req.query.page || 1), limit=Number(req.query.limit || 10);
  const filter=req.query.scope==='network' ? {author:{$in:[req.user._id,...(req.user.connections || [])]}} : {};
  const [posts,total]=await Promise.all([Post.find(filter).populate('author','firstName lastName avatar headline').populate('comments.author','firstName lastName avatar').sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit),Post.countDocuments(filter)]);
  const result={posts,page,pages:Math.ceil(total/limit),total};
  if(req.feedCacheKey) await cacheSet(req.feedCacheKey,result);
  res.json(result);
};
export const createPost = async (req,res) => {
  const post=await Post.create({author:req.user._id,content:req.body.content,image:req.body.image || ''});
  const populated=await Post.findById(post._id).populate('author','firstName lastName avatar headline');
  await invalidateFeed();res.status(201).json(populated);
};
export const likePost = async (req,res) => {
  const userId=req.user._id;
  // Each update is atomic; simultaneous different users cannot overwrite likes.
  let post=await Post.findOneAndUpdate({_id:req.params.id,likes:{$ne:userId}},{$addToSet:{likes:userId}},{new:true});
  let liked=true;
  if(!post) {liked=false;post=await Post.findByIdAndUpdate(req.params.id,{$pull:{likes:userId}},{new:true});}
  if(!post) return res.status(404).json({message:'Post not found'});
  await invalidateFeed();
  res.json({likes:post.likes.length,liked,likeIds:post.likes});
};
export const addComment = async (req,res) => {
  const post=await Post.findByIdAndUpdate(req.params.id,{$push:{comments:{author:req.user._id,text:req.body.text}}},{new:true,runValidators:true}).populate('comments.author','firstName lastName avatar');
  if(!post) return res.status(404).json({message:'Post not found'});
  const comment=post.comments[post.comments.length-1];
  await invalidateFeed();
  await notify({recipient:post.author,actor:req.user._id,type:'comment',message:`${req.user.firstName} commented on your post`,link:'/feed'});
  res.status(201).json(comment);
};
export const deletePost = async (req,res) => {
  const post=await Post.findById(req.params.id);
  if(!post) return res.status(404).json({message:'Post not found'});
  if(String(post.author)!==String(req.user._id)) return res.status(403).json({message:'You can only delete your own posts.'});
  await post.deleteOne();await invalidateFeed();res.json({message:'Post removed'});
};

export const getPopular = async (req, res) => {
  const rows = await Post.aggregate([
    { $addFields: { likeCount: { $size: { $ifNull: ['$likes', []] } }, commentCount: { $size: { $ifNull: ['$comments', []] } } } },
    { $sort: { likeCount: -1, commentCount: -1, createdAt: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorInfo', pipeline: [{ $project: { firstName: 1, lastName: 1, avatar: 1 } }] } },
    { $project: { content: 1, createdAt: 1, likeCount: 1, commentCount: 1, author: { $arrayElemAt: ['$authorInfo', 0] } } },
  ]);
  if (req.feedCacheKey) await cacheSet(req.feedCacheKey, rows);
  res.json(rows);
};
