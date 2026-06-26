// server.js - entry point. Imports the configured app and starts listening.
import app from "./app.js";
import { pingDatabase } from "./db.js";
import "dotenv/config";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
  pingDatabase(); // logs whether the DB is reachable; does not block startup
});
