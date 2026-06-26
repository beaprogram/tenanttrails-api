// middleware/auth.js - verifies the JWT and attaches the user to the request.
// The token now comes from the httpOnly cookie (set at login). We still accept
// an Authorization: Bearer header as a fallback so Postman keeps working.
import jwt from "jsonwebtoken";
import "dotenv/config";

export function auth(req, res, next) {
  const header = req.headers.authorization;            // "Bearer <token>"
  const bearer = header && header.split(" ")[1];
  const token = req.cookies?.token || bearer;          // cookie first

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, iat, exp }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
