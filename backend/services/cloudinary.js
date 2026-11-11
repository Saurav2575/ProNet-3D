import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const uploadsDirectory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../uploads');
export const imageExtension=buffer=>{
  if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255) return 'jpg';
  if(buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP') return 'webp';
  return null;
};
export const uploadImage=async(buffer,folder='posts')=>{
  const extension=imageExtension(buffer);
  if(!extension){const err=new Error('Choose a PNG, JPEG, or WebP image.');err.status=400;throw err;}
  if(process.env.CLOUDINARY_CLOUD_NAME&&process.env.CLOUDINARY_API_KEY&&process.env.CLOUDINARY_API_SECRET){
    cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});
    try {
      const result=await new Promise((resolve,reject)=>cloudinary.uploader.upload_stream({folder:`pronet/${folder}`,resource_type:'image',timeout:15000},(err,result)=>err?reject(err):resolve(result)).end(buffer));
      return {url:result.secure_url,publicId:result.public_id,storage:'cloudinary'};
    }catch{const err=new Error('Image upload failed. Please try again.');err.status=502;throw err;}
  }
  await mkdir(uploadsDirectory,{recursive:true});
  const name=`${randomUUID()}.${extension}`;await writeFile(path.join(uploadsDirectory,name),buffer);
  return {url:`/uploads/${name}`,storage:'local'};
};
