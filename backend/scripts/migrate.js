import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Connection from '../models/Connection.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
dotenv.config({path:path.join(root,'.env')});
try{
  await connectDB();
  // Stop the application and back up the database before migrating existing records.
  const records=await Connection.find({}).sort({createdAt:1});const seen=new Map();
  for(const c of records){const key=[String(c.requester),String(c.recipient)].sort().join(':');if(seen.has(key)){throw new Error('Opposite-direction duplicate connections exist. Resolve them before migration; no records will be removed automatically.');}seen.set(key,c);}
  for(const [pairKey,c] of seen){if(c.status==='rejected')await c.deleteOne();else await Connection.updateOne({_id:c._id},{$set:{pairKey}});}
  let imported=0;
  for(const job of await Job.find({applicants:{$exists:true,$ne:[]}})){
    for(const applicant of job.applicants){const result=await Application.updateOne({job:job._id,applicant},{$setOnInsert:{job:job._id,applicant,coverLetter:'Imported application from the original version. No cover letter was recorded.',resumeUrl:'',status:'submitted',createdAt:job.createdAt}},{upsert:true});imported+=result.upsertedCount;}
  }
  await Connection.createIndexes();console.log(`Migration finished. Imported ${imported} legacy applications. No resumes were present in the original records.`);
}catch(err){console.error('Migration failed:',err.message);process.exitCode=1;}finally{await mongoose.disconnect();}
