import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import asyncHandler from "../middlewares/async-handler.middleware.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFound, BadRequest } from "../utils/error/httpErrors.js";

// Get all users
const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select("-password");
  successResponse(res, users, "Users retrieved successfully");
});

// Get all admin users
const getAllAdminUsers = asyncHandler(async (_req, res) => {
  const adminUsers = await User.find({ role: "admin" }).select("-password");

  if (adminUsers.length === 0) {
    throw NotFound("No admin users found");
  }

  successResponse(res, adminUsers, "Admin users retrieved successfully");
});

// Get current user's profile
const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw NotFound("User not found");
  }

  successResponse(res, user, "User profile retrieved successfully");
});

// Update current user's profile
const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw NotFound("User not found");
  }

  user.username = username || user.username;
  user.email = email || user.email;

  const updatedUser = await user.save();

  successResponse(res, updatedUser, "Profile updated successfully");
});

// Delete user by ID
const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFound("User not found");
  }

  if (user.role === "admin") {
    throw BadRequest("Cannot delete admin user");
  }

  await User.deleteOne({ _id: user._id });
  successResponse(res, user, "User removed successfully");
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw NotFound("User not found");
  }

  successResponse(res, user, "User retrieved successfully");
});

// Update user by ID (admin only)
const updateUserById = asyncHandler(async (req, res) => {
  const { username, email, role } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFound("User not found");
  }

  user.username = username || user.username;
  user.email = email || user.email;
  user.role = role || user.role;

  const updatedUser = await user.save();

  successResponse(res, updatedUser, "User updated successfully");
});

export {
  getAllUsers,
  getAllAdminUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteUserById,
  getUserById,
  updateUserById,
};