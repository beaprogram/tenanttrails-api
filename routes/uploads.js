// routes/uploads.js - generic image upload to the CDN.
// multer receives the file into memory; the SDK streams it to Cloudinary;
// we return the secure_url to store on whatever record the image belongs to.
import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { uploadBuffer } from "../config/cloudinary.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});

// POST /api/uploads - protected. Field name: "image".
router.post("/", auth, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "image file is required" });
    }
    const result = await uploadBuffer(req.file.buffer);
    res.json({ url: result.secure_url }); // store this URL on the record
  } catch (err) {
    return res.status(502).json({ error: "Upload failed", detail: err.message });
  }
});

export default router;
