import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { uploadImage } from '../services/cloudinary.js';
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(req,file,cb)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.mimetype)){const err=new Error('Choose a JPEG, PNG, or WebP image.');err.status=400;return cb(err);}
  cb(null,true);
}});
router.post('/',protect,upload.single('image'),asyncHandler(async(req,res)=>{
  if(!req.file) return res.status(400).json({message:'Select an image to upload.'});
  const folder=['profiles','covers','posts'].includes(req.body.folder)?req.body.folder:'posts';
  res.status(201).json(await uploadImage(req.file.buffer,folder));
}));
export default router;
