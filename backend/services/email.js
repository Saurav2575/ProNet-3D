import nodemailer from 'nodemailer';
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const networkingEmail=({name,message,link})=>({subject:'ProNet: '+message,text:`Hi ${name},\n\n${message}\n${link}\n\nProNet`,html:`<div style="font-family:Arial,sans-serif;max-width:560px"><h1>ProNet</h1><p>Hi ${escapeHTML(name)},</p><p>${escapeHTML(message)}</p><p><a href="${escapeHTML(link)}">View in ProNet</a></p></div>`});
export const sendNotificationEmail=async(user,notification)=>{
  if(!process.env.SMTP_HOST || !process.env.SMTP_FROM) return {skipped:true};
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined,connectionTimeout:5000,socketTimeout:5000});
  const template=networkingEmail({name:user.firstName,message:notification.message,link:(process.env.CLIENT_URL||'http://localhost:5173')+notification.link});
  return transport.sendMail({from:process.env.SMTP_FROM,to:user.email,...template});
};
