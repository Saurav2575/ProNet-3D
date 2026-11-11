import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { escapeRegex } from '../middleware/validate.js';
import { notify } from '../services/notifications.js';
const fields=['title','company','location','type','description','salary','isActive'];
const pick=body=>Object.fromEntries(fields.filter(f=>body[f]!==undefined).map(f=>[f,body[f]]));
const employerFields='firstName lastName avatar company';
export const getJobs=async(req,res)=>{
  const {q,type,location}=req.query;const filter={isActive:true};
  if(q?.trim()){const re=new RegExp(escapeRegex(q.trim()),'i');filter.$or=[{title:re},{company:re},{description:re}];}
  if(type) filter.type=type;
  if(location?.trim()) filter.location=new RegExp(escapeRegex(location.trim()),'i');
  const jobs=await Job.find(filter).populate('postedBy',employerFields).sort({createdAt:-1}).skip((Number(req.query.page||1)-1)*Number(req.query.limit||50)).limit(Number(req.query.limit||50));
  res.json(jobs);
};
export const createJob=async(req,res)=>{
  const job=await Job.create({...pick(req.body),isActive:true,postedBy:req.user._id});
  res.status(201).json(await job.populate('postedBy',employerFields));
};
export const getJob=async(req,res)=>{
  const job=await Job.findById(req.params.id).populate('postedBy',employerFields);
  if(!job) return res.status(404).json({message:'Job not found'});
  res.json(job);
};
export const updateJob=async(req,res)=>{
  const job=await Job.findById(req.params.id);
  if(!job) return res.status(404).json({message:'Job not found'});
  if(String(job.postedBy)!==String(req.user._id)) return res.status(403).json({message:'Only the job owner can edit this listing.'});
  Object.assign(job,pick(req.body));await job.save();res.json(job);
};
export const applyToJob=async(req,res)=>{
  const job=await Job.findById(req.params.id);
  if(!job) return res.status(404).json({message:'Job not found'});
  if(!job.isActive) return res.status(400).json({message:'This job is closed and no longer accepts applications.'});
  if(String(job.postedBy)===String(req.user._id)) return res.status(400).json({message:'You cannot apply to your own job listing.'});
  if(job.applicants.some(id=>String(id)===String(req.user._id))) return res.status(409).json({message:'You have already applied to this job.'});
  const application=await Application.create({job:job._id,applicant:req.user._id,coverLetter:req.body.coverLetter,resumeUrl:req.body.resumeUrl});
  const updated=await Job.findOneAndUpdate({_id:job._id,isActive:true},{$addToSet:{applicants:req.user._id}});
  if(!updated){await application.deleteOne();return res.status(400).json({message:'This job has just closed.'});}
  await notify({recipient:job.postedBy,actor:req.user._id,type:'application',message:`${req.user.firstName} applied for ${job.title}`,link:'/jobs?tab=recruiter'});
  res.status(201).json(application);
};
export const myApplications=async(req,res)=>res.json(await Application.find({applicant:req.user._id}).populate('job','title company location type isActive').sort({createdAt:-1}));
export const myJobs=async(req,res)=>res.json(await Job.find({postedBy:req.user._id}).sort({createdAt:-1}));
export const getApplicants=async(req,res)=>{
  const job=await Job.findById(req.params.id);
  if(!job) return res.status(404).json({message:'Job not found'});
  if(String(job.postedBy)!==String(req.user._id)) return res.status(403).json({message:'Only the recruiter can view these applications.'});
  res.json(await Application.find({job:job._id}).populate('applicant','firstName lastName email avatar headline skills').sort({createdAt:-1}));
};
export const updateApplication=async(req,res)=>{
  const application=await Application.findById(req.params.applicationId).populate('job');
  if(!application) return res.status(404).json({message:'Application not found'});
  if(String(application.job.postedBy)!==String(req.user._id)) return res.status(403).json({message:'Only the recruiter can update this application.'});
  application.status=req.body.status;await application.save();
  await notify({recipient:application.applicant,actor:req.user._id,type:'application_status',message:`Your application for ${application.job.title} is now ${application.status}`,link:'/jobs?tab=applications'});
  res.json(application);
};
