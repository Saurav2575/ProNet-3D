import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendNotificationEmail } from './email.js';
export const notify=async data=>{
  if(String(data.recipient)===String(data.actor)) return;
  try {
    const notification=await Notification.create(data);
    // Email is explicitly opt-in; primary workflows never depend on SMTP.
    if(process.env.EMAIL_NOTIFICATIONS==='true') {
      const user=await User.findById(data.recipient);
      if(user) sendNotificationEmail(user,notification).catch(()=>console.warn('Notification email could not be delivered.'));
    }
  }catch(err){if(process.env.NODE_ENV!=='test') console.warn('Could not create notification:',err.message);}
};
