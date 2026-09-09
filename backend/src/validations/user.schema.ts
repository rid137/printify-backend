import { z } from "zod";
import { emailSchema, usernameSchema } from "./common.schema.js";

/** Partial profile update — empty body is allowed (no-op), matching prior controller behavior. */
export const updateProfileBodySchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
});

export const updateUserByIdBodySchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type UpdateUserByIdBody = z.infer<typeof updateUserByIdBodySchema>;
