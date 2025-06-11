import jwt from "jsonwebtoken";

const generateToken = (userId: string): string => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });

  return token;
};

export default generateToken;