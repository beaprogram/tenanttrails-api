// utils/token.js - signs a JWT carrying the user's id.
// The token is the proof of identity the client sends on every request.
import jwt from "jsonwebtoken";
import "dotenv/config";

export function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
