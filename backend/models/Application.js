import mongoose from 'mongoose';
const schema=new mongoose.Schema({
  job:{type:mongoose.Schema.Types.ObjectId,ref:'Job',required:true},
  applicant:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  coverLetter:{type:String,required:true,trim:true,maxlength:3000},
  resumeUrl:{type:String,required:true,maxlength:1000},
  status:{type:String,enum:['submitted','reviewing','shortlisted','rejected','hired'],default:'submitted'},
},{timestamps:true});
schema.index({job:1,applicant:1},{unique:true});
schema.index({applicant:1,createdAt:-1});
export default mongoose.model('Application',schema);
