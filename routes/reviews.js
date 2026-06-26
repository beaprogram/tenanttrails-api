// routes/reviews.js - comment resources that hang off a review.
import { Router } from "express";
import multer from "multer";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { uploadBuffer } from "../config/cloudinary.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/reviews/:id/comments - protected. Add a comment to a review.
// The author comes from the verified token.
router.post("/:id/comments", auth, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({ error: "Invalid review id" });
    }

    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ error: "body is required" });
    }

    const [[review]] = await pool.query(
      "SELECT id FROM reviews WHERE id = ?",
      [reviewId]
    );
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const [result] = await pool.query(
      "INSERT INTO comments (review_id, user_id, body, created) VALUES (?, ?, ?, CURDATE())",
      [reviewId, req.user.id, body]
    );

    const [[comment]] = await pool.query(
      `SELECT c.id, c.review_id, c.body, c.created,
              u.id AS user_id, u.name AS user_name, u.initials AS user_initials
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      id: comment.id,
      review_id: comment.review_id,
      body: comment.body,
      created: comment.created,
      user: { id: comment.user_id, name: comment.user_name, initials: comment.user_initials },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/:id/image - protected. Upload a photo and attach it to
// the review by storing the returned Cloudinary URL on reviews.image_url.
router.post("/:id/image", auth, upload.single("image"), async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({ error: "Invalid review id" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "image file is required" });
    }

    const [[review]] = await pool.query(
      "SELECT id FROM reviews WHERE id = ?",
      [reviewId]
    );
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    let result;
    try {
      result = await uploadBuffer(req.file.buffer);
    } catch (err) {
      return res.status(502).json({ error: "Upload failed", detail: err.message });
    }

    await pool.query("UPDATE reviews SET image_url = ? WHERE id = ?", [
      result.secure_url,
      reviewId,
    ]);

    res.json({ id: reviewId, image_url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:id - protected. Edit a review's rating and body.
// Authorization: you may only edit your OWN review (403 otherwise).
router.put("/:id", auth, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({ error: "Invalid review id" });
    }

    const { rating, body } = req.body;
    if (rating === undefined || body === undefined) {
      return res.status(400).json({ error: "rating and body are required" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be an integer 1-5" });
    }

    const [[review]] = await pool.query(
      "SELECT user_id FROM reviews WHERE id = ?",
      [reviewId]
    );
    if (!review) return res.status(404).json({ error: "Review not found" });

    // 401 = not logged in (handled by auth). 403 = logged in, not your review.
    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your review" });
    }

    await pool.query("UPDATE reviews SET rating = ?, body = ? WHERE id = ?", [
      rating,
      body,
      reviewId,
    ]);

    res.json({ id: reviewId, rating, body });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reviews/:id - protected. Remove a review you own (403 otherwise).
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({ error: "Invalid review id" });
    }

    const [[review]] = await pool.query(
      "SELECT user_id FROM reviews WHERE id = ?",
      [reviewId]
    );
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not your review" });
    }

    // Remove dependent comments first (FK), then the review.
    await pool.query("DELETE FROM comments WHERE review_id = ?", [reviewId]);
    await pool.query("DELETE FROM reviews WHERE id = ?", [reviewId]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
