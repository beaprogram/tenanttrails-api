// routes/auth.js - signup, login, logout, and the current-user route.
// Auth now lives in an httpOnly cookie the browser stores and sends automatically.
import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { signToken } from "../utils/token.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// Cookie options shared by login and signup.
const COOKIE_OPTS = {
  httpOnly: true,                       // JavaScript on the page cannot read it
  sameSite: "lax",
  secure: false,                        // true behind HTTPS in production
  maxAge: 7 * 24 * 60 * 60 * 1000,      // 7 days
};

function initialsFrom(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// POST /api/auth/signup - hash the password, insert the user, set the cookie.
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, initials) VALUES (?, ?, ?, ?)",
      [name, email, hash, initialsFrom(name)]
    );

    const user = { id: result.insertId, name, email };
    res.cookie("token", signToken(user.id), COOKIE_OPTS);
    return res.status(201).json({ user, token: signToken(user.id) });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  }
});

// POST /api/auth/login - check the password, then set the cookie.
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const [[user]] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.cookie("token", signToken(user.id), COOKIE_OPTS);
    return res.json({ user: safeUser, token: signToken(user.id) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout - clear the cookie.
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

// GET /api/auth/me - protected; returns { user } for the cookie's owner.
router.get("/me", auth, async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      "SELECT id, name, email, initials FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
