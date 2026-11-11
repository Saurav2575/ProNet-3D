import express from 'express';
import { getProfile,updateProfile,searchUsers,getUserPosts,getSuggestions } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler as wrap } from '../middleware/asyncHandler.js';
import { validate,profileValidation,searchValidation,validateId } from '../middleware/validate.js';
const router=express.Router();router.use(protect);router.param('id',validateId);
router.get('/search',validate(searchValidation),wrap(searchUsers));router.get('/suggestions',wrap(getSuggestions));
router.put('/profile',validate(profileValidation),wrap(updateProfile));router.get('/:id/posts',wrap(getUserPosts));router.get('/:id',wrap(getProfile));
export default router;
