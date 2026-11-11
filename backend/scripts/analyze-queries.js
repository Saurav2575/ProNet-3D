import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
dotenv.config({path:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../.env')});
try{
  await connectDB();
  const user=await User.findOne();
  if(!user)console.log('Add a user and some posts before measuring query plans.');
  else{
    const feed=await Post.find({author:user._id}).sort({createdAt:-1}).limit(10).explain('executionStats');
    const people=await User.find({company:user.company}).sort({firstName:1,lastName:1}).limit(20).explain('executionStats');
    for(const [name,plan]of Object.entries({feed,people}))console.log(JSON.stringify({name,winningPlan:plan.queryPlanner.winningPlan,executionStats:plan.executionStats},null,2));
  }
}catch(err){console.error(err.message);process.exitCode=1;}finally{await mongoose.disconnect();}
