import express from 'express';
import { deleteUserById, getAllAdminUsers, getAllUsers, getUserById, updateUserById } from '../../controllers/user.controller.js';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate, authorizeAdmin);

// ADMIN ROUTES
router.get("/all-users", authenticate, authorizeAdmin, getAllUsers);
router.get("/admin-users", authenticate, authorizeAdmin, getAllAdminUsers)
router
  .route("/current-user/:id")
  .delete(authenticate, authorizeAdmin, deleteUserById)
  .get(authenticate, authorizeAdmin, getUserById)
  .put(authenticate, authorizeAdmin, updateUserById);

export default router;