// config/cloudinary.js - point the SDK at your Cloudinary account.
// The three values come from Console > Settings > API Keys and live in .env.
// The api_secret stays on the server, never in the frontend or git.
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper: stream a file buffer to Cloudinary and resolve with the result.
// multer gives us the file in memory (req.file.buffer); the SDK streams it up.
export function uploadBuffer(buffer, folder = "tenanttrails") {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (err, result) =>
        err ? reject(err) : resolve(result)
      )
      .end(buffer);
  });
}
