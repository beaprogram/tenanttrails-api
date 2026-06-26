// routes/profile.js - the logged-in user and their own reviews.
import { Router } from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// GET /api/profile - protected. Returns { user, reviews } for the cookie's owner.
// Each review carries the apartment name so the profile page needs one call.
router.get("/", auth, async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      "SELECT id, name, email, initials FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const [reviews] = await pool.query(
      `SELECT r.id,
              r.apt_id                       AS aptId,
              a.name                         AS apartmentName,
              r.rating,
              r.body,
              DATE_FORMAT(r.created, '%Y-%m-%d') AS date
       FROM reviews r
       JOIN apartments a ON a.id = r.apt_id
       WHERE r.user_id = ?
       ORDER BY r.created DESC, r.id DESC`,
      [req.user.id]
    );

    res.json({ user, reviews });
  } catch (err) {
    next(err);
  }
});

export default router;
