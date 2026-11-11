import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { notify } from '../services/notifications.js';
import { invalidateFeed } from '../services/cache.js';
const between=(a,b)=>({$or:[{requester:a,recipient:b},{requester:b,recipient:a}]});
export const sendRequest=async(req,res)=>{
  const recipientId=req.params.userId;
  if(recipientId===String(req.user._id)) return res.status(400).json({message:'You cannot connect with yourself.'});
  if(!await User.exists({_id:recipientId})) return res.status(404).json({message:'User not found'});
  // Unordered pair key prevents two simultaneous opposite requests.
  const existing=await Connection.findOne(between(req.user._id,recipientId));
  if(existing) return res.status(409).json({message:'A connection or invitation already exists.'});
  const connection=await Connection.create({requester:req.user._id,recipient:recipientId,pairKey:[String(req.user._id),recipientId].sort().join(':')});
  await notify({recipient:recipientId,actor:req.user._id,type:'connection_request',message:`${req.user.firstName} ${req.user.lastName} invited you to connect`,link:'/network'});
  res.status(201).json(connection);
};
export const getPendingRequests=async(req,res)=>res.json(await Connection.find({recipient:req.user._id,status:'pending'}).populate('requester','firstName lastName avatar headline company'));
export const respondToRequest=async(req,res)=>{
  const connection=await Connection.findById(req.params.id);
  if(!connection) return res.status(404).json({message:'Request not found'});
  if(String(connection.recipient)!==String(req.user._id)) return res.status(403).json({message:'Only the invitation recipient can respond.'});
  if(connection.status!=='pending') return res.status(409).json({message:'This invitation has already been handled.'});
  if(req.body.action==='reject'){
    await Connection.deleteOne({_id:connection._id,status:'pending'});
    return res.json({message:'Invitation ignored'});
  }
  // Idempotent updates allow a failed response to be retried without duplicate links.
  await Promise.all([User.updateOne({_id:connection.requester},{$addToSet:{connections:connection.recipient}}),User.updateOne({_id:connection.recipient},{$addToSet:{connections:connection.requester}})]);
  connection.status='accepted';await connection.save();await invalidateFeed();
  await notify({recipient:connection.requester,actor:req.user._id,type:'connection_accepted',message:`${req.user.firstName} accepted your connection invitation`,link:'/network'});
  res.json({message:'Connection accepted',connection});
};
export const getConnections=async(req,res)=>{
  const user=await User.findById(req.user._id).populate('connections','firstName lastName avatar headline company role');
  res.json(user.connections.filter(Boolean));
};
export const getConnectionStatus=async(req,res)=>{
  const connection=await Connection.findOne(between(req.user._id,req.params.userId));
  res.json({status:connection?.status==='rejected'?'none':connection?.status||'none',connectionId:connection?._id});
};
