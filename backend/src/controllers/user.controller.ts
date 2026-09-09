import asyncHandler from "../middlewares/async-handler.middleware.js";
import { paginatedResponse, successResponse } from "../utils/apiResponse.js";
import { UserService } from "../services/user.service.js";
import type { PaginationQuery } from "../validations/common.schema.js";
import type {
  UpdateProfileBody,
  UpdateUserByIdBody,
} from "../validations/user.schema.js";

const getAllUsers = asyncHandler(async (req, res) => {
  const { page, size } = req.query as unknown as PaginationQuery;
  const { users, meta } = await UserService.getAllUsers({ page, size });
  paginatedResponse(res, users, meta, "Users retrieved successfully");
});

const getAllAdminUsers = asyncHandler(async (_req, res) => {
  const adminUsers = await UserService.getAllAdminUsers();
  successResponse(res, adminUsers, "Admin users retrieved successfully");
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await UserService.getProfileById(req.user._id);
  successResponse(res, user, "User profile retrieved successfully");
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const updatedUser = await UserService.updateProfile(
    req.user._id,
    req.body as UpdateProfileBody
  );
  successResponse(res, updatedUser, "Profile updated successfully");
});

const deleteUserById = asyncHandler(async (req, res) => {
  const user = await UserService.deleteById(req.params.id);
  successResponse(res, user, "User removed successfully");
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getById(req.params.id);
  successResponse(res, user, "User retrieved successfully");
});

const updateUserById = asyncHandler(async (req, res) => {
  const updatedUser = await UserService.updateById(
    req.params.id,
    req.body as UpdateUserByIdBody
  );
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
