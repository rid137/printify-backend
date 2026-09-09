import User from "../models/user.model.js";
import { BadRequest, NotFound } from "../utils/error/httpErrors.js";
import type {
  UpdateProfileBody,
  UpdateUserByIdBody,
} from "../validations/user.schema.js";

export class UserService {
  static async getAllUsers(pagination: { page: number; size: number }) {
    const { page, size } = pagination;
    const filter = {};

    const [totalDocuments, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size),
    ]);

    return {
      users,
      meta: {
        currentPage: page,
        perPage: size,
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / size) || 0,
      },
    };
  }

  static async getAllAdminUsers() {
    const adminUsers = await User.find({ role: "admin" }).select("-password");

    if (adminUsers.length === 0) {
      throw NotFound("No admin users found");
    }

    return adminUsers;
  }

  static async getProfileById(userId: unknown) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw NotFound("User not found");
    }

    return user;
  }

  static async updateProfile(userId: unknown, input: UpdateProfileBody) {
    const { username, email } = input;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw NotFound("User not found");
    }

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;

    return user.save();
  }

  static async deleteById(userId: string) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw NotFound("User not found");
    }

    if (user.role === "admin") {
      throw BadRequest("Cannot delete admin user");
    }

    await User.deleteOne({ _id: user._id });
    return user;
  }

  static async getById(userId: string) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw NotFound("User not found");
    }

    return user;
  }

  static async updateById(userId: string, input: UpdateUserByIdBody) {
    const { username, email, role } = input;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw NotFound("User not found");
    }

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;

    return user.save();
  }
}
