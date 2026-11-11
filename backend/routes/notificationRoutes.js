import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateId } from '../middleware/validate.js';
const router=express.Router();router.use(protect);router.param('id',validateId);
router.get('/',asyncHandler(async(req,res)=>{
  const [items,unread]=await Promise.all([Notification.find({recipient:req.user._id}).sort({createdAt:-1}).limit(50),Notification.countDocuments({recipient:req.user._id,read:false})]);res.json({items,unread});
}));
router.put('/read-all',asyncHandler(async(req,res)=>{await Notification.updateMany({recipient:req.user._id,read:false},{$set:{read:true}});res.json({message:'All notifications marked read'});}));
router.put('/:id/read',asyncHandler(async(req,res)=>{
  const item=await Notification.findOneAndUpdate({_id:req.params.id,recipient:req.user._id},{$set:{read:true}},{new:true});
  if(!item) return res.status(404).json({message:'Notification not found'});res.json(item);
}));
export default router;
