import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isResourceOwner } from "../src/utils/ownership.js";
import { isOwnedCloudinaryPublicId } from "../src/utils/cloudinary-public-id.js";

const USER_A = "507f1f77bcf86cd799439011";
const USER_B = "507f1f77bcf86cd799439012";
const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("authorization / IDOR predicates", () => {
  it("user cannot access another user's resource by owner id", () => {
    assert.equal(isResourceOwner(USER_A, USER_A), true);
    assert.equal(isResourceOwner(USER_A, USER_B), false);
    assert.equal(isResourceOwner({ _id: USER_A }, USER_B), false);
    assert.equal(isResourceOwner({ _id: USER_A }, USER_A), true);
    assert.equal(isResourceOwner(null, USER_A), false);
  });

  it("user cannot attach another user's Cloudinary publicId", () => {
    const owned = `${USER_A}_${UUID}`;
    assert.equal(isOwnedCloudinaryPublicId(USER_A, owned), true);
    assert.equal(isOwnedCloudinaryPublicId(USER_B, owned), false);
    assert.equal(
      isOwnedCloudinaryPublicId(USER_B, `printing-app/${owned}`),
      false
    );
  });
});
