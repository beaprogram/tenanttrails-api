// app.js - builds and configures the Express app, then exports it.
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import authRoutes from "./routes/auth.js";
import apartmentRoutes from "./routes/apartments.js";
import reviewRoutes from "./routes/reviews.js";
import uploadRoutes from "./routes/uploads.js";
import profileRoutes from "./routes/profile.js";

const app = express();

// CORS must name the React origin (not "*") and allow credentials, so the
// browser will send and accept the httpOnly auth cookie across origins.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());   // parse JSON request bodies into req.body
app.use(cookieParser());   // parse the auth cookie into req.cookies

// Health check - no database required, useful for a quick "is it up?" test.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/apartments", apartmentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/profile", profileRoutes);

// 404 for anything unmatched.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler - any next(err) lands here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

export default app;
