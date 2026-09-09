import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLEANUP_CLOUDINARY_ON_ORDER_CREATE_FAILURE,
  canDestroyUploadedResource,
  isOwnedCloudinaryPublicId,
  toCanonicalCloudinaryPublicId,
} from "../src/utils/cloudinary-public-id.js";

const USER_A = "507f1f77bcf86cd799439011";
const USER_B = "507f1f77bcf86cd799439012";
const UUID = "550e8400-e29b-41d4-a716-446655440000";
const ownedId = `${USER_A}_${UUID}`;

describe("Cloudinary publicId ownership", () => {
  it("accepts this user's printing-app id and rejects others", () => {
    assert.equal(isOwnedCloudinaryPublicId(USER_A, ownedId), true);
    assert.equal(
      isOwnedCloudinaryPublicId(USER_A, `printing-app/${ownedId}`),
      true
    );
    assert.equal(
      isOwnedCloudinaryPublicId(USER_B, `printing-app/${ownedId}`),
      false
    );
    assert.equal(isOwnedCloudinaryPublicId(USER_A, "random-id"), false);
    assert.equal(
      toCanonicalCloudinaryPublicId(ownedId),
      `printing-app/${ownedId}`
    );
  });

  it("allows destroy only for owned ids not yet returned to the client", () => {
    assert.equal(
      canDestroyUploadedResource(USER_A, ownedId, { returnedToClient: false }),
      true
    );
    assert.equal(
      canDestroyUploadedResource(USER_A, ownedId, { returnedToClient: true }),
      false
    );
    assert.equal(
      canDestroyUploadedResource(USER_B, ownedId, { returnedToClient: false }),
      false
    );
  });

  it("does not delete Cloudinary files when order create fails", () => {
    assert.equal(CLEANUP_CLOUDINARY_ON_ORDER_CREATE_FAILURE, false);
  });
});
