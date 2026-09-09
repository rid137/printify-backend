import jwt from "jsonwebtoken";
import { getJwtSecret, JWT_SIGN_ALGORITHM } from "../config/secrets.js";

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: "30d",
    algorithm: JWT_SIGN_ALGORITHM,
  });
};

export default generateToken;
