import mongoose from 'mongoose';
const schema=new mongoose.Schema({recipient:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},type:{type:String,required:true},message:{type:String,required:true,maxlength:500},link:{type:String,default:'/feed'},read:{type:Boolean,default:false}},{timestamps:true});
schema.index({recipient:1,read:1,createdAt:-1});
export default mongoose.model('Notification',schema);
