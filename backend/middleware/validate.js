import { body, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
export const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const validateId = (req, res, next, value) => {
  if (!mongoose.isObjectIdOrHexString(value)) return res.status(400).json({ message: 'A valid record ID is required.' });
  next();
};
const text = (field, max, required = false) => {
  const rule = body(field);
  if (!required) rule.optional();
  return rule.isString().withMessage(`${field} must be text`).bail().trim().isLength({ min: required ? 1 : 0, max }).withMessage(`${field} must ${required ? 'not be empty and ' : ''}be at most ${max} characters`);
};
const imageURL = field => body(field).optional({ values: 'falsy' }).isString().bail().custom(value => /^https?:\/\//.test(value) || /^\/uploads\/[a-f0-9-]+\.(png|jpg|webp)$/.test(value)).withMessage('Use an uploaded image or a valid HTTP image URL');
export const registerValidation = [text('firstName',80,true),text('lastName',80,true),body('email').isString().bail().trim().toLowerCase().isEmail().isLength({max:254}).withMessage('Enter a valid email address'),body('password').isString().bail().isLength({min:6,max:128}).withMessage('Password must contain 6–128 characters')];
export const loginValidation = [body('email').isString().bail().trim().toLowerCase().isEmail().withMessage('Enter a valid email address'),body('password').isString().bail().isLength({min:1,max:128}).withMessage('Enter your password')];
export const postValidation = [text('content',3000,true),imageURL('image')];
export const commentValidation = [text('text',1000,true)];
export const profileValidation = [text('firstName',80,true).optional(),text('lastName',80,true).optional(),text('headline',200),text('bio',2000),text('location',150),text('company',150),text('role',150),imageURL('avatar'),imageURL('coverPhoto'),body('skills').optional().isArray({max:30}).withMessage('Add at most 30 skills'),body('skills.*').isString().bail().trim().isLength({min:1,max:60}).withMessage('Each skill must contain 1–60 characters')];
export const jobValidation = [text('title',150,true),text('company',150,true),text('description',5000,true),text('location',150),text('salary',100),body('type').optional().isIn(['full-time','part-time','contract','internship','remote']).withMessage('Choose a valid job type')];
export const jobUpdateValidation = jobValidation.map(rule => rule.optional()).concat(body('isActive').optional().isBoolean().withMessage('Job availability must be true or false').toBoolean());
export const applicationValidation = [text('coverLetter',3000,true),body('resumeUrl').isString().bail().trim().isLength({max:1000}).isURL({protocols:['http','https'],require_protocol:true}).withMessage('Enter a valid public HTTP/HTTPS resume link')];
export const paginationValidation = [query('page').optional().isInt({min:1,max:100000}).withMessage('Page must be a positive integer'),query('limit').optional().isInt({min:1,max:50}).withMessage('Limit must be between 1 and 50')];
export const searchValidation = [query('q').optional().isString().bail().isLength({max:150}).withMessage('Search is limited to 150 characters'),query('location').optional().isString().bail().isLength({max:150}),query('company').optional().isString().bail().isLength({max:150}),query('type').optional({values:'falsy'}).isIn(['full-time','part-time','contract','internship','remote']).withMessage('Choose a valid job type')];
export const validate = validations => async (req,res,next) => {
  try {
    // Sequential execution keeps field sanitizers ordered.
    for (const rule of validations) await rule.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    next();
  } catch(err) { next(err); }
};
