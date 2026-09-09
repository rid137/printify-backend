/**
 * Compare a resource owner id (ObjectId, string, or populated doc) to the authenticated user id.
 */
export const isResourceOwner = (
  resourceUserId: unknown,
  authenticatedUserId: unknown
): boolean => {
  if (resourceUserId == null || authenticatedUserId == null) {
    return false;
  }

  const ownerId =
    typeof resourceUserId === "object" &&
    resourceUserId !== null &&
    "_id" in resourceUserId
      ? String((resourceUserId as { _id: unknown })._id)
      : String(resourceUserId);

  return ownerId === String(authenticatedUserId);
};
