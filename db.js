// db.js - shared mysql2 connection pool.
// A pool reuses connections across many concurrent requests,
// which is what a server needs (never createConnection per request).
import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "tenanttrails",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional startup check: confirms the API can reach the database.
// Tolerant by design - logs a warning instead of crashing the server,
// so the API still boots for routes that do not touch the DB.
export async function pingDatabase() {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    console.log("DB connected:", process.env.DB_NAME || "tenanttrails");
    return true;
  } catch (err) {
    console.warn("DB not reachable yet:", err.code || err.message);
    return false;
  }
}
