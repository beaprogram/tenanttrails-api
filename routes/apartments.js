// routes/apartments.js - apartment resources.
import { Router } from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// GET /api/apartments - the dashboard list.
// Each apartment comes back with its average rating and review count.
// LEFT JOIN keeps apartments that have zero reviews; the aggregation is
// the Week 4 GROUP BY.
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*,
             ROUND(AVG(r.rating), 1) AS rating,
             COUNT(r.id)             AS reviews
      FROM apartments a
      LEFT JOIN reviews r ON r.apt_id = a.id
      GROUP BY a.id
      ORDER BY a.name
    `);

    const apartments = rows.map((a) => ({
      ...a,
      rating: a.rating === null ? null : Number(a.rating),
      reviews: Number(a.reviews),
    }));

    res.json(apartments);
  } catch (err) {
    next(err);
  }
});

// GET /api/apartments/:id - one apartment with its reviews, each review
// carrying its author and any comments. This is the Apartment Detail payload.
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid apartment id" });
    }

    const [[apartment]] = await pool.query(
      "SELECT * FROM apartments WHERE id = ?",
      [id]
    );
    if (!apartment) {
      return res.status(404).json({ error: "Apartment not found" });
    }

    // Reviews with their author.
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.body, r.created, r.image_url,
              u.id AS user_id, u.name AS user_name, u.initials AS user_initials
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.apt_id = ?
       ORDER BY r.created DESC`,
      [id]
    );

    // Comments for those reviews, with their author.
    const reviewIds = reviews.map((r) => r.id);
    let comments = [];
    if (reviewIds.length) {
      [comments] = await pool.query(
        `SELECT c.id, c.review_id, c.body, c.created,
                u.id AS user_id, u.name AS user_name, u.initials AS user_initials
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.review_id IN (?)
         ORDER BY c.created ASC`,
        [reviewIds]
      );
    }

    // Shape a review or comment row into a nested object with its author.
    const shape = (row) => ({
      id: row.id,
      ...(row.rating !== undefined ? { rating: row.rating } : {}),
      body: row.body,
      created: row.created,
      ...(row.image_url !== undefined ? { image_url: row.image_url } : {}),
      user: { id: row.user_id, name: row.user_name, initials: row.user_initials },
    });

    const commentsByReview = {};
    for (const c of comments) {
      (commentsByReview[c.review_id] ||= []).push(shape(c));
    }

    const reviewsOut = reviews.map((r) => ({
      ...shape(r),
      comments: commentsByReview[r.id] || [],
    }));

    const ratings = reviews.map((r) => r.rating);
    const avg = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    res.json({
      ...apartment,
      rating: avg,
      review_count: reviews.length,
      reviews: reviewsOut,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/apartments/:id/reviews - the apartment page's review list.
// Fields are ALIASED so the JSON matches the React app's contract:
// snake_case columns become camelCase, created becomes date, author from join.
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const aptId = Number(req.params.id);
    if (!Number.isInteger(aptId)) {
      return res.status(400).json({ error: "Invalid apartment id" });
    }

    const [rows] = await pool.query(
      `SELECT r.id,
              r.apt_id                       AS aptId,
              r.user_id                      AS userId,
              u.name                         AS author,
              r.rating,
              r.body,
              DATE_FORMAT(r.created, '%Y-%m-%d') AS date,
              r.image_url                    AS imageUrl
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.apt_id = ?
       ORDER BY r.created DESC, r.id DESC`,
      [aptId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/apartments/:id/reviews - protected. Add a review to an apartment.
// The author is taken from the verified token, never the request body.
router.post("/:id/reviews", auth, async (req, res, next) => {
  try {
    const aptId = Number(req.params.id);
    if (!Number.isInteger(aptId)) {
      return res.status(400).json({ error: "Invalid apartment id" });
    }

    const { rating, body } = req.body;
    if (rating === undefined || body === undefined) {
      return res.status(400).json({ error: "rating and body are required" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be an integer 1-5" });
    }

    const [[apartment]] = await pool.query(
      "SELECT id FROM apartments WHERE id = ?",
      [aptId]
    );
    if (!apartment) {
      return res.status(404).json({ error: "Apartment not found" });
    }

    const [result] = await pool.query(
      "INSERT INTO reviews (apt_id, user_id, rating, body, created) VALUES (?, ?, ?, ?, CURDATE())",
      [aptId, req.user.id, rating, body]
    );

    const [[review]] = await pool.query(
      `SELECT r.id, r.rating, r.body, r.created, r.image_url,
              u.id AS user_id, u.name AS user_name, u.initials AS user_initials
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      id: review.id,
      rating: review.rating,
      body: review.body,
      created: review.created,
      image_url: review.image_url,
      user: { id: review.user_id, name: review.user_name, initials: review.user_initials },
      comments: [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
