import assert from "node:assert/strict";
import { describe, it } from "node:test";
import jwt from "jsonwebtoken";
import {
  JWT_SIGN_ALGORITHM,
  JWT_VERIFY_ALGORITHMS,
  getJwtSecret,
} from "../src/config/secrets.js";
import createToken from "../src/utils/createToken.js";

describe("JWT verification", () => {
  const previous = process.env.JWT_SECRET;

  const withSecret = (fn: () => void) => {
    process.env.JWT_SECRET = "unit-test-jwt-secret";
    try {
      fn();
    } finally {
      if (previous === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = previous;
      }
    }
  };

  it("signs HS256 tokens with expiry", () => {
    withSecret(() => {
      const token = createToken("507f1f77bcf86cd799439011");
      const decoded = jwt.verify(token, getJwtSecret(), {
        algorithms: [...JWT_VERIFY_ALGORITHMS],
      }) as jwt.JwtPayload;

      assert.equal(decoded.userId, "507f1f77bcf86cd799439011");
      assert.equal(typeof decoded.exp, "number");

      const header = JSON.parse(
        Buffer.from(token.split(".")[0], "base64url").toString()
      ) as { alg?: string };
      assert.equal(header.alg, JWT_SIGN_ALGORITHM);
    });
  });

  it("rejects expired JWT", () => {
    withSecret(() => {
      const expired = jwt.sign(
        { userId: "507f1f77bcf86cd799439011", exp: Math.floor(Date.now() / 1000) - 30 },
        getJwtSecret(),
        { algorithm: JWT_SIGN_ALGORITHM }
      );
      assert.throws(() =>
        jwt.verify(expired, getJwtSecret(), {
          algorithms: [...JWT_VERIFY_ALGORITHMS],
        })
      );
    });
  });

  it("rejects tampered JWT", () => {
    withSecret(() => {
      const token = createToken("507f1f77bcf86cd799439011");
      const [h, p, s] = token.split(".");
      const payload = JSON.parse(Buffer.from(p, "base64url").toString()) as {
        userId: string;
      };
      payload.userId = "tampered";
      const tampered = `${h}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${s}`;
      assert.throws(() =>
        jwt.verify(tampered, getJwtSecret(), {
          algorithms: [...JWT_VERIFY_ALGORITHMS],
        })
      );
    });
  });

  it("rejects alg=none JWT", () => {
    withSecret(() => {
      const noneHeader = Buffer.from(
        JSON.stringify({ alg: "none", typ: "JWT" })
      ).toString("base64url");
      const nonePayload = Buffer.from(
        JSON.stringify({ userId: "507f1f77bcf86cd799439011" })
      ).toString("base64url");
      assert.throws(() =>
        jwt.verify(`${noneHeader}.${nonePayload}.`, getJwtSecret(), {
          algorithms: [...JWT_VERIFY_ALGORITHMS],
        })
      );
    });
  });

  it("rejects malformed JWT", () => {
    withSecret(() => {
      assert.throws(() =>
        jwt.verify("not-a-jwt", getJwtSecret(), {
          algorithms: [...JWT_VERIFY_ALGORITHMS],
        })
      );
    });
  });
});
