import express from 'express';
import { deleteUserById, getAllAdminUsers, getAllUsers, getCurrentUserProfile, getUserById, updateCurrentUserProfile, updateUserById } from '../../controllers/user.controller.js';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// USER ROUTES
router
  .route("/profile")
  .get(authenticate, getCurrentUserProfile)
  .put(authenticate, updateCurrentUserProfile);
  


export default router;